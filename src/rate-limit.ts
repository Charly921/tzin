import type { Middleware } from './middleware.js'

// ── Types ────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Maximum requests per window (default: 100) */
  max?: number
  /** Window duration in ms (default: 60000 = 1 minute) */
  windowMs?: number
  /** Key function to identify clients (default: IP) */
  keyGenerator?: (req: Request) => string
  /** Custom error response */
  onLimitReached?: (req: Request, retryAfter: number) => Response
  /** Skip certain requests */
  skip?: (req: Request) => boolean
  /** Custom store for distributed rate limiting */
  store?: RateLimitStore
  /** Headers to include in response */
  headers?: boolean
}

export interface RateLimitStore {
  get(key: string): { count: number; resetTime: number } | null
  increment(key: string, windowMs: number): { count: number; resetTime: number }
  decrement(key: string): void
  reset(key: string): void
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: number
  retryAfter: number
}

// ── Memory Store ─────────────────────────────────────────────────────

class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  get(key: string): { count: number; resetTime: number } | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      return null
    }

    return entry
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const existing = this.get(key)

    if (existing) {
      existing.count++
      return existing
    }

    const entry = { count: 1, resetTime: Date.now() + windowMs }
    this.store.set(key, entry)
    return entry
  }

  decrement(key: string): void {
    const entry = this.store.get(key)
    if (entry && entry.count > 0) {
      entry.count--
    }
  }

  reset(key: string): void {
    this.store.delete(key)
  }
}

// ── Sliding Window Counter Store ─────────────────────────────────────

class SlidingWindowStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  get(key: string): { count: number; resetTime: number } | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      return null
    }

    return entry
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now()
    const existing = this.get(key)

    if (existing) {
      // Sliding window: keep the same reset time
      existing.count++
      return existing
    }

    const entry = { count: 1, resetTime: now + windowMs }
    this.store.set(key, entry)
    return entry
  }

  decrement(key: string): void {
    const entry = this.store.get(key)
    if (entry && entry.count > 0) {
      entry.count--
    }
  }

  reset(key: string): void {
    this.store.delete(key)
  }
}

// ── Default Key Generator ────────────────────────────────────────────

function defaultKeyGenerator(req: Request): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default (in real apps, this would be the socket IP)
  return 'unknown'
}

// ── Rate Limit Middleware ────────────────────────────────────────────

/**
 * Rate limiting middleware.
 *
 * Limits the number of requests from a client within a time window.
 *
 * @example
 * ```ts
 * import { rateLimit } from '@carlos-tzin/tzin/rate-limit'
 *
 * const app = createApp(routes, {
 *   middleware: [rateLimit({ max: 100, windowMs: 60000 })],
 * })
 * ```
 *
 * @example
 * ```ts
 * // Per-route rate limiting
 * const app = createApp([
 *   impl(getUser, async (input) => {
 *     // This handler has its own rate limit
 *     return { status: 200 as const, body: { ok: true } }
 *   })
 * ], {
 *   middleware: [rateLimit({ max: 10, windowMs: 60000 })],
 * })
 * ```
 */
export function rateLimit(config: RateLimitConfig = {}): Middleware {
  const {
    max = 100,
    windowMs = 60000,
    keyGenerator = defaultKeyGenerator,
    onLimitReached = defaultOnLimitReached,
    skip,
    headers = true,
  } = config

  const store = config.store ?? new MemoryStore()

  return async ({ req, next }) => {
    // Skip if configured
    if (skip?.(req)) {
      return next()
    }

    const key = keyGenerator(req)
    const { count, resetTime } = store.increment(key, windowMs)
    const remaining = Math.max(0, max - count)
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

    // Check if limit exceeded
    if (count > max) {
      store.decrement(key)
      return onLimitReached(req, retryAfter)
    }

    const response = await next()

    // Add rate limit headers
    if (headers) {
      const newResponse = new Response(response.body, response)
      newResponse.headers.set('X-RateLimit-Limit', max.toString())
      newResponse.headers.set('X-RateLimit-Remaining', remaining.toString())
      newResponse.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())
      return newResponse
    }

    return response
  }
}

/**
 * Strict rate limiting for sensitive endpoints (login, password reset).
 * Uses sliding window for more accurate limiting.
 */
export function strictRateLimit(config: RateLimitConfig = {}): Middleware {
  const store = new SlidingWindowStore()

  return rateLimit({
    ...config,
    store,
    max: config.max ?? 5,
    windowMs: config.windowMs ?? 900000, // 15 minutes
  })
}

/**
 * Create a rate limiter with custom key generation.
 */
export function createRateLimiter(config: RateLimitConfig & {
  /** Endpoint name for logging */
  endpoint?: string
}): Middleware {
  return rateLimit(config)
}

// ── Helpers ──────────────────────────────────────────────────────────

function defaultOnLimitReached(_req: Request, retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'Retry-After': retryAfter.toString(),
      },
    },
  )
}

// ── Utilities ────────────────────────────────────────────────────────

/**
 * Get rate limit info from response headers.
 */
export function getRateLimitInfo(response: Response): RateLimitInfo | null {
  const limit = response.headers.get('X-RateLimit-Limit')
  const remaining = response.headers.get('X-RateLimit-Remaining')
  const reset = response.headers.get('X-RateLimit-Reset')

  if (!limit || !remaining || !reset) return null

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    resetTime: parseInt(reset, 10) * 1000,
    retryAfter: parseInt(response.headers.get('Retry-After') ?? '0', 10),
  }
}
