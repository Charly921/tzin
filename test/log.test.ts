import { describe, it, expect, vi } from 'vitest'
import { log, configure, getLogger } from '../src/log.js'

describe('Logger', () => {
  it('creates a logger', () => {
    const logger = getLogger('test')
    expect(logger).toBeDefined()
    expect(logger.info).toBeInstanceOf(Function)
    expect(logger.error).toBeInstanceOf(Function)
  })

  it('has child loggers', () => {
    const child = log.child('db')
    expect(child).toBeDefined()
  })

  it('calls transport with log entry', () => {
    const transport = vi.fn()
    configure({ transport })

    log.info('test message', { key: 'value' })

    expect(transport).toHaveBeenCalled()
    const entry = transport.mock.calls[0][0]
    expect(entry.level).toBe('info')
    expect(entry.message).toBe('test message')
    expect(entry.data).toEqual({ key: 'value' })
  })

  it('filters by log level', () => {
    const transport = vi.fn()
    configure({ level: 'warn', transport })

    log.debug('debug message')
    log.info('info message')
    log.warn('warn message')
    log.error('error message')

    expect(transport).toHaveBeenCalledTimes(2)
    expect(transport.mock.calls[0][0].level).toBe('warn')
    expect(transport.mock.calls[1][0].level).toBe('error')
  })
})
