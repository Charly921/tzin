// ── Types ────────────────────────────────────────────────────────────

export interface JobConfig {
  /** Unique job name */
  name: string
  /** Max retries on failure (default: 3) */
  maxRetries?: number
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number
  /** Job timeout in ms (default: 30000) */
  timeout?: number
}

export interface JobDefinition<Payload = unknown> {
  readonly name: string
  readonly config: JobConfig
  /** Process the job */
  handler: (payload: Payload, ctx: JobContext) => Promise<void>
}

export interface JobContext {
  /** Job attempt number (0-based) */
  attempt: number
  /** Abort signal for cancellation */
  signal: AbortSignal
  /** Logger scoped to this job */
  log: JobLogger
}

export interface JobLogger {
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
}

export interface Job<Payload = unknown> {
  /** Job name */
  readonly name: string
  /** Job configuration */
  readonly config: JobConfig
  /** Enqueue the job for processing */
  enqueue(payload: Payload, options?: EnqueueOptions): Promise<JobHandle>
}

export interface EnqueueOptions {
  /** Delay before processing in ms */
  delay?: number
  /** Schedule for a specific time */
  scheduledAt?: Date
}

export interface JobHandle {
  /** Job ID */
  id: string
  /** Poll for completion */
  wait(): Promise<JobResult>
}

export interface JobResult {
  status: 'completed' | 'failed'
  error?: string
  duration: number
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface JobRecord {
  id: string
  name: string
  payload: unknown
  status: JobStatus
  attempt: number
  maxRetries: number
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

// ── In-memory Job Queue ─────────────────────────────────────────────

export interface JobStore {
  add(record: JobRecord): void
  update(id: string, data: Partial<JobRecord>): void
  getById(id: string): JobRecord | null
  getPending(): JobRecord[]
}

class MemoryJobStore implements JobStore {
  private records = new Map<string, JobRecord>()

  add(record: JobRecord): void {
    this.records.set(record.id, { ...record })
  }

  update(id: string, data: Partial<JobRecord>): void {
    const record = this.records.get(id)
    if (record) Object.assign(record, data)
  }

  getById(id: string): JobRecord | null {
    const record = this.records.get(id)
    return record ? { ...record } : null
  }

  getPending(): JobRecord[] {
    return [...this.records.values()].filter((r) => r.status === 'pending')
  }
}

// ── Queue State ──────────────────────────────────────────────────────

let globalStore: JobStore = new MemoryJobStore()
let processing = false
let processTimer: ReturnType<typeof setTimeout> | null = null
const handlers = new Map<string, (payload: unknown, ctx: JobContext) => Promise<void>>()

// ── defineJob ────────────────────────────────────────────────────────

/**
 * Define a background job.
 *
 * @example
 * ```ts
 * import { defineJob } from '@carlos-tzin/tzin/jobs'
 *
 * const sendEmail = defineJob<{ to: string; subject: string; body: string }>({
 *   name: 'send-email',
 *   maxRetries: 3,
 *   handler: async (payload, ctx) => {
 *     ctx.log.info('Sending email', { to: payload.to })
 *     await resend.emails.send({ ... })
 *   },
 * })
 *
 * // In a handler:
 * await sendEmail.enqueue({ to: 'ada@example.com', subject: 'Hello', body: '...' })
 * ```
 */
export function defineJob<Payload = void>(config: JobConfig & {
  handler: (payload: Payload, ctx: JobContext) => Promise<void>
}): Job<Payload> {
  const jobConfig: JobConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    ...config,
  }

  handlers.set(config.name, config.handler as (payload: unknown, ctx: JobContext) => Promise<void>)

  return {
    name: config.name,
    config: jobConfig,

    async enqueue(payload, options) {
      const id = `${config.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const record: JobRecord = {
        id,
        name: config.name,
        payload,
        status: 'pending',
        attempt: 0,
        maxRetries: jobConfig.maxRetries!,
        createdAt: new Date(),
        ...(options?.scheduledAt && { scheduledAt: options.scheduledAt }),
      }

      globalStore.add(record)
      scheduleProcess()

      return {
        id,
        async wait(): Promise<JobResult> {
          return waitForJob(id, jobConfig.timeout! * (jobConfig.maxRetries! + 1))
        },
      }
    },
  }
}

// ── Processing ───────────────────────────────────────────────────────

function scheduleProcess(): void {
  if (processTimer) return
  processTimer = setTimeout(async () => {
    processTimer = null
    await processPending()
  }, 10)
}

async function processPending(): Promise<void> {
  if (processing) return
  processing = true

  try {
    const pending = globalStore.getPending()
    for (const record of pending) {
      await processRecord(record)
    }
  } finally {
    processing = false
    if (globalStore.getPending().length > 0) {
      scheduleProcess()
    }
  }
}

async function processRecord(record: JobRecord): Promise<void> {
  const handler = handlers.get(record.name)
  if (!handler) {
    globalStore.update(record.id, { status: 'failed', error: 'No handler found' })
    return
  }

  globalStore.update(record.id, { status: 'running', startedAt: new Date() })

  const controller = new AbortController()
  const ctx: JobContext = {
    attempt: record.attempt,
    signal: controller.signal,
    log: createLogger(record.name),
  }

  try {
    await Promise.race([
      handler(record.payload, ctx),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Job timeout')), 30000),
      ),
    ])

    globalStore.update(record.id, {
      status: 'completed',
      completedAt: new Date(),
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    const attempt = record.attempt + 1

    if (attempt < record.maxRetries) {
      globalStore.update(record.id, { status: 'pending', attempt })
      setTimeout(() => scheduleProcess(), 1000)
    } else {
      globalStore.update(record.id, {
        status: 'failed',
        error,
        attempt,
        completedAt: new Date(),
      })
    }
  }
}

function waitForJob(id: string, timeout: number): Promise<JobResult> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const record = globalStore.getById(id)
      if (!record) {
        reject(new Error('Job not found'))
        return
      }

      if (record.status === 'completed') {
        resolve({
          status: 'completed',
          duration: (record.completedAt?.getTime() ?? Date.now()) - record.createdAt.getTime(),
        })
        return
      }

      if (record.status === 'failed') {
        resolve({
          status: 'failed',
          error: record.error,
          duration: (record.completedAt?.getTime() ?? Date.now()) - record.createdAt.getTime(),
        })
        return
      }

      if (Date.now() - start > timeout) {
        reject(new Error('Timeout waiting for job'))
        return
      }

      setTimeout(check, 100)
    }
    check()
  })
}

function createLogger(name: string): JobLogger {
  const prefix = `[job:${name}]`
  return {
    info: (msg, data) => console.log(prefix, msg, data ?? ''),
    warn: (msg, data) => console.warn(prefix, msg, data ?? ''),
    error: (msg, data) => console.error(prefix, msg, data ?? ''),
  }
}

// ── Utilities ────────────────────────────────────────────────────────

/**
 * Get all job records (useful for debugging).
 */
export function getJobRecords(): JobRecord[] {
  return (globalStore as MemoryJobStore)['records']
    ? [...((globalStore as MemoryJobStore)['records'] as Map<string, JobRecord>).values()]
    : []
}

/**
 * Reset the job store (useful for testing).
 */
export function resetJobs(): void {
  globalStore = new MemoryJobStore()
  handlers.clear()
}
