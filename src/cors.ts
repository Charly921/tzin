import type { Middleware } from './middleware.js'

/**
 * How Access-Control-Allow-Origin is computed for a request origin.
 * - '*': literal wildcard (invalid alongside credentials:true)
 * - true: reflect any request origin (credentials-safe)
 * - string[]: allow-list; the matching entry is echoed back
 */
export interface CorsOptions {
  origin?: string | true | string[]
  /** Default: GET, HEAD, PUT, PATCH, POST, DELETE. */
  methods?: string[]
  /** Echoed back when the browser asks via access-control-request-headers. */
  allowHeaders?: string[]
  /** Response headers the browser may read from JS. */
  exposeHeaders?: string[]
  credentials?: boolean
  /** Preflight cache lifetime in seconds. Default 24h. */
  maxAge?: number
}

/**
 * CORS as onion middleware. Register outermost so preflight OPTIONS requests
 * short-circuit before routing (a preflight never matches a route).
 *
 * A disallowed origin does not error: the response simply carries no
 * Access-Control-Allow-Origin header and the browser enforces the block.
 */
export function cors(options: CorsOptions = {}): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowHeaders,
    exposeHeaders,
    credentials = false,
    maxAge = 86400,
  } = options

  const methodsHeader = methods.join(', ')

  function allowOriginFor(requestOrigin: string | null): string | undefined {
    if (Array.isArray(origin)) {
      return requestOrigin && origin.includes(requestOrigin) ? requestOrigin : undefined
    }
    if (origin === true) return requestOrigin ?? undefined
    // origin is now '*' or an explicit string.
    return credentials ? undefined : origin
  }

  return async ({ req, next }) => {
    const requestOrigin = req.headers.get('origin')
    const requestedMethod = req.headers.get('access-control-request-method')
    const isPreflight = req.method === 'OPTIONS' && requestedMethod !== null

    // Not a CORS request (same-origin GETs, curl, server-to-server): untouched.
    if (!requestOrigin && !isPreflight) return next()

    const allowOrigin = allowOriginFor(requestOrigin)
    const baseHeaders: Record<string, string> = {
      vary: 'Origin',
      ...(allowOrigin ? { 'access-control-allow-origin': allowOrigin } : {}),
      ...(allowOrigin && credentials ? { 'access-control-allow-credentials': 'true' } : {}),
    }

    if (isPreflight) {
      const requestedHeaders =
        req.headers.get('access-control-request-headers') ?? allowHeaders?.join(', ')
      return new Response(null, {
        status: 204,
        headers: {
          ...baseHeaders,
          'access-control-allow-methods': methodsHeader,
          'access-control-max-age': String(maxAge),
          ...(requestedHeaders ? { 'access-control-allow-headers': requestedHeaders } : {}),
        },
      })
    }

    const res = await next()
    for (const [k, v] of Object.entries(baseHeaders)) res.headers.set(k, v)
    if (exposeHeaders?.length) {
      res.headers.set('access-control-expose-headers', exposeHeaders.join(', '))
    }
    return res
  }
}
