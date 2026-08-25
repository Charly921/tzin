import type { Middleware } from './middleware.js'

// ── Types ────────────────────────────────────────────────────────────

export interface CacheConfig {
  /** Cache duration in ms (default: 60000 = 1 minute) */
  ttl?: number
  /** Key generator function (default: URL + method) */
  keyGenerator?: (req: Request) => string
  /** Only cache certain methods (default: GET, HEAD) */
  methods?: string[]
  /** Only cache certain status codes (default: 200) */
  statuses?: number[]
  /** Skip caching for certain requests */
  skip?: (req: Request) => boolean
  /** Custom cache store */
  store?: CacheStore
  /** Include cache headers in response */
  headers?: boolean
  /** Vary headers for cache key */
  vary?: string[]
}

export interface CacheStore {
  get(key: string): CacheEntry | null
  set(key: string, entry: CacheEntry): void
  delete(key: string): void
  clear(): void
}

export interface CacheEntry {
  response: CachedResponse
  timestamp: number
  ttl: number
}

export interface CachedResponse {
  status: number
  headers: Record<string, string>
  body: string
}

// ── Memory Store ─────────────────────────────────────────────────────

class MemoryCacheStore implements CacheStore {
  private store = new Map<string, CacheEntry>()

  get(key: string): CacheEntry | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.store.delete(key)
      return null
    }

    return entry
  }

  set(key: string, entry: CacheEntry): void {
    this.store.set(key, entry)
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

// ── Default Key Generator ────────────────────────────────────────────

function defaultKeyGenerator(req: Request): string {
  const url = new URL(req.url)
  return `${req.method}:${url.pathname}${url.search}`
}

// ── Cache Middleware ─────────────────────────────────────────────────

/**
 * HTTP caching middleware.
 *
 * Caches responses based on URL and method. Supports TTL, cache invalidation,
 * and cache headers.
 *
 * @example
 * ```ts
 * import { cache } from '@carlos-tzin/tzin/cache'
 *
 * const app = createApp(routes, {
 *   middleware: [cache({ ttl: 60000 })], // 1 minute cache
 * })
 * ```
 *
 * @example
 * ```ts
 * // Per-route caching
 * const app = createApp([
 *   impl(getUser, async (input) => {
 *     return { status: 200 as const, body: { id: '1', name: 'Ada' } }
 *   })
 * ], {
 *   middleware: [cache({ ttl: 300000 })], // 5 minutes
 * })
 * ```
 */
export function cache(config: CacheConfig = {}): Middleware {
  const {
    ttl = 60000,
    keyGenerator = defaultKeyGenerator,
    methods = ['GET', 'HEAD'],
    statuses = [200],
    headers = true,
    vary = [],
  } = config

  const store = config.store ?? new MemoryCacheStore()

  return async ({ req, next }) => {
    // Only cache specified methods
    if (!methods.includes(req.method)) {
      return next()
    }

    // Skip if configured
    if (config.skip?.(req)) {
      return next()
    }

    const key = keyGenerator(req)

    // Check cache
    const cached = store.get(key)
    if (cached) {
      const response = new Response(cached.response.body, {
        status: cached.response.status,
        headers: cached.response.headers,
      })

      if (headers) {
        response.headers.set('X-Cache', 'HIT')
        response.headers.set('X-Cache-Age', Math.floor((Date.now() - cached.timestamp) / 1000).toString())
      }

      return response
    }

    // Execute request
    const response = await next()

    // Only cache specified status codes
    if (!statuses.includes(response.status)) {
      return response
    }

    // Clone response to read body
    const clonedResponse = response.clone()
    const body = await clonedResponse.text()

    // Build headers object
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    // Store in cache
    store.set(key, {
      response: {
        status: response.status,
        headers: responseHeaders,
        body: body as string,
      },
      timestamp: Date.now(),
      ttl,
    })

    // Add cache headers
    if (headers) {
      const newResponse = new Response(body, {
        status: response.status,
        headers: responseHeaders,
      })

      newResponse.headers.set('X-Cache', 'MISS')
      newResponse.headers.set('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`)
      newResponse.headers.set('ETag', `"${hashString(key + body)}"`)
      return newResponse
    }

    return response
  }
}

/**
 * Stale-while-revalidate caching.
 *
 * Returns stale cache immediately while revalidating in background.
 */
export function staleWhileRevalidate(config: CacheConfig & {
  /** Stale duration in ms (how long to serve stale) */
  staleTtl?: number
} = {}): Middleware {
  const { staleTtl = 86400000, ...cacheConfig } = config
  const store = cacheConfig.store ?? new MemoryCacheStore()

  return async ({ req, next }) => {
    const key = (cacheConfig.keyGenerator ?? defaultKeyGenerator)(req)
    const cached = store.get(key)

    if (cached) {
      const age = Date.now() - cached.timestamp
      const isStale = age > (cacheConfig.ttl ?? 60000)

      if (isStale && age < staleTtl) {
        // Serve stale immediately, revalidate in background
        const response = new Response(cached.response.body, {
          status: cached.response.status,
          headers: cached.response.headers,
        })

        response.headers.set('X-Cache', 'STALE')
        response.headers.set('Warning', '110 - "Response is stale"')

        // Revalidate in background (fire and forget)
        next().then((freshResponse) => {
          if (freshResponse.ok) {
            freshResponse.clone().text().then((freshBody) => {
              const headers: Record<string, string> = {}
              freshResponse.headers.forEach((v, k) => { headers[k] = v })
              store.set(key, {
                response: { status: freshResponse.status, headers, body: freshBody as string },
                timestamp: Date.now(),
                ttl: cacheConfig.ttl ?? 60000,
              })
            })
          }
        }).catch(() => {})

        return response
      }
    }

    // Normal cache flow
    return cache(cacheConfig)({ req, ctx: undefined as never, next })
  }
}

/**
 * Cache invalidation middleware.
 *
 * Invalidates cache entries based on patterns.
 */
export function invalidateCache(config: {
  /** Pattern to match keys for invalidation */
  pattern?: RegExp
  /** Specific keys to invalidate */
  keys?: string[]
  /** Custom invalidation function */
  invalidator?: (req: Request) => string[]
}): Middleware {
  const store = config.pattern || config.keys ? new MemoryCacheStore() : null

  return async ({ req, next }) => {
    // Check for cache invalidation headers
    const invalidate = req.headers.get('X-Cache-Invalidate')
    if (invalidate === 'true') {
      store?.clear()
    }

    // Check for specific key invalidation
    if (config.keys) {
      for (const key of config.keys) {
        store?.delete(key)
      }
    }

    // Check for custom invalidation
    if (config.invalidator) {
      const keys = config.invalidator(req)
      for (const key of keys) {
        store?.delete(key)
      }
    }

    return next()
  }
}

// ── Utilities ────────────────────────────────────────────────────────

/**
 * Get cache info from response headers.
 */
export function getCacheInfo(response: Response): {
  hit: boolean
  age?: number
} | null {
  const cacheHeader = response.headers.get('X-Cache')
  if (!cacheHeader) return null

  return {
    hit: cacheHeader === 'HIT',
    age: response.headers.get('X-Cache-Age')
      ? parseInt(response.headers.get('X-Cache-Age')!, 10)
      : undefined,
  }
}

/**
 * Simple string hash function.
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}
