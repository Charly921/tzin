// ── Types ────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogEntry {
  level: LogLevel
  message: string
  data?: Record<string, unknown>
  timestamp: Date
  context?: string
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
  fatal(message: string, data?: Record<string, unknown>): void
  /** Create a child logger with a prefix */
  child(prefix: string): Logger
}

export interface LoggerConfig {
  /** Minimum log level (default: 'info') */
  level?: LogLevel
  /** Custom transport function */
  transport?: (entry: LogEntry) => void
  /** Include timestamp in output (default: true) */
  timestamp?: boolean
  /** Pretty print with colors (default: true in dev) */
  pretty?: boolean
}

// ── Log Level Order ──────────────────────────────────────────────────

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

// ── Colors ───────────────────────────────────────────────────────────

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  fatal: '\x1b[35m', // magenta
}

const RESET = '\x1b[0m'

// ── Default Transport ────────────────────────────────────────────────

function defaultTransport(entry: LogEntry, config: LoggerConfig): void {
  const { level, message, data, timestamp, context } = entry
  const showTimestamp = config.timestamp !== false
  const pretty = config.pretty !== false

  if (pretty) {
    const color = COLORS[level]
    const prefix = context ? `[${context}]` : ''
    const time = showTimestamp ? `${timestamp.toISOString()} ` : ''
    const dataStr = data && Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : ''
    console.log(`${color}${time}${prefix} ${level.toUpperCase()}${RESET} ${message}${dataStr}`)
  } else {
    const json: Record<string, unknown> = { level, message, timestamp: timestamp.toISOString() }
    if (context) json.context = context
    if (data && Object.keys(data).length > 0) json.data = data
    console.log(JSON.stringify(json))
  }
}

// ── Logger Factory ───────────────────────────────────────────────────

function createLogger(context?: string): Logger {
  function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const config = globalConfig
    const minLevel = LOG_LEVELS[config.level ?? 'info']
    if (LOG_LEVELS[level] < minLevel) return

    const transport = config.transport ?? ((entry) => defaultTransport(entry, config))

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      context,
    }

    transport(entry)
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, data) => log('error', msg, data),
    fatal: (msg, data) => log('fatal', msg, data),
    child: (prefix) => createLogger(context ? `${context}:${prefix}` : prefix),
  }
}

// ── Global Logger ────────────────────────────────────────────────────

let globalConfig: LoggerConfig = {}

/**
 * Configure the global logger.
 *
 * @example
 * ```ts
 * import { configure } from '@carlos-tzin/tzin/log'
 *
 * configure({ level: 'debug', pretty: true })
 * ```
 */
export function configure(config: LoggerConfig): void {
  globalConfig = config
}

/**
 * Get the global logger.
 *
 * @example
 * ```ts
 * import { getLogger } from '@carlos-tzin/tzin/log'
 *
 * const log = getLogger()
 * log.info('Server started', { port: 3000 })
 * ```
 */
export function getLogger(context?: string): Logger {
  return createLogger(context)
}

/** Convenience export - reads config dynamically */
export const log: Logger = createLogger()
