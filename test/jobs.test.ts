import { describe, it, expect, beforeEach } from 'vitest'
import { defineJob, resetJobs } from '../src/jobs.js'

describe('defineJob', () => {
  beforeEach(() => {
    resetJobs()
  })

  it('creates a job definition', () => {
    const sendEmail = defineJob<{ to: string }>({
      name: 'send-email',
      handler: async (payload) => {
        // mock handler
      },
    })

    expect(sendEmail.name).toBe('send-email')
    expect(sendEmail.config.maxRetries).toBe(3)
  })

  it('enqueues a job', async () => {
    const sendEmail = defineJob<{ to: string }>({
      name: 'send-email',
      handler: async (payload) => {
        // mock handler
      },
    })

    const handle = await sendEmail.enqueue({ to: 'ada@example.com' })
    expect(handle.id).toBeDefined()
  })

  it('processes job and completes', async () => {
    let processed = false

    const sendEmail = defineJob<{ to: string }>({
      name: 'send-email',
      handler: async (payload) => {
        processed = true
      },
    })

    const handle = await sendEmail.enqueue({ to: 'ada@example.com' })
    await handle.wait()

    expect(processed).toBe(true)
  })

  it('retries on failure', async () => {
    let attempts = 0

    const failingJob = defineJob<void>({
      name: 'failing-job',
      maxRetries: 2,
      handler: async () => {
        attempts++
        if (attempts <= 2) throw new Error('Temporary failure')
      },
    })

    const handle = await failingJob.enqueue()
    await handle.wait()

    expect(attempts).toBe(2)
  })
})
