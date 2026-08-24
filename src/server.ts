import { Value } from './schema.js'
import { HttpError, isRawResult, type RouteImpl } from './contract.js'
import { createMatcher } from './router.js'
import { Ctx, type ContextKey } from './context.js'
import { compose, type Middleware } from './middleware.js'
import type { ProvidedEntry } from './provide.js'
import { handleMcpMessage } from './mcp.js'
import { renderLlmsTxt, renderLlmsFullTxt, type ApiMeta } from './llms.js'

export interface App {
  routes: RouteImpl<any>[]
  fetch(req: Request): Promise<Response>
}

export interface AppOptions {
  middleware?: Middleware[]
  provides?: ProvidedEntry[]
  /** Serve the MCP Streamable HTTP transport at POST /mcp. */
  mcp?: boolean
  /** Serve /llms.txt and /llms-full.txt generated from contracts. */
  llms?: boolean
  meta?: ApiMeta
}

function validationError(section: string, schema: unknown, value: unknown): HttpError {
  const errors = [...Value.Errors(schema as never, value)].map(
    (e) => `${e.path || '/'}: ${e.message}`,
  )
  return new HttpError(400, `Invalid ${section}`, errors)
}

function check(section: string, schema: unknown, value: unknown): void {
  if (!Value.Check(schema as never, value)) throw validationError(section, schema, value)
}

/**
 * Runtime-agnostic app: pure (req) => res over Web Standards.
 * Testable without a server (app.fetch), adaptable to Node/Bun/Deno/Workers.
 */
function pathnameOf(url: string): string {
  const path = url.slice(url.indexOf('/', url.indexOf('//') + 2))
  const end = path.search(/[?#]/)
  return end === -1 ? path : path.slice(0, end)
}

export function createApp(routes: RouteImpl<any>[], options: AppOptions = {}): App {
  const matchRoute = createMatcher(
    routes.map((r) => ({ method: r.contract.method, path: r.contract.path, route: r })),
  )

  async function dispatch(req: Request, ctx: Ctx): Promise<Response> {
    const pathname = pathnameOf(req.url)
    const hit = matchRoute(req.method, pathname)
    if (!hit) throw new HttpError(404, 'Not Found')

    const c = hit.route.contract
    const input: Record<string, unknown> = { ctx }

    if ('params' in c && c.params) {
      check('path params', c.params, hit.params)
      input.params = hit.params
    }

    if ('query' in c && c.query) {
      const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
      const rawQuery = Object.fromEntries(new URLSearchParams(qs))
      check('query', c.query, rawQuery)
      input.query = rawQuery
    }

    if ('headers' in c && c.headers) {
      const raw: Record<string, string> = {}
      req.headers.forEach((v, k) => {
        raw[k] = v
      })
      check('headers', c.headers, raw)
      input.headers = raw
    }

    if ('cookies' in c && c.cookies) {
      const rawCookies: Record<string, string> = {}
      for (const part of (req.headers.get('cookie') ?? '').split(';')) {
        const i = part.indexOf('=')
        if (i > 0) rawCookies[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
      }
      check('cookies', c.cookies, rawCookies)
      input.cookies = rawCookies
    }

    if ('body' in c && c.body) {
      let json: unknown
      try {
        json = await req.json()
      } catch {
        throw new HttpError(400, 'Malformed JSON body')
      }
      check('body', c.body, json)
      input.body = json
    }

    const result = await hit.route.handler(input as never)
    if (isRawResult(result)) return result.__tzin_raw
    return Response.json(result.body, { status: result.status })
  }

  const middleware = options.middleware ?? []
  const handle: (req: Request, ctx: Ctx) => Promise<Response> = middleware.length
    ? compose(middleware, dispatch)
    : dispatch
  const seed = new Map<ContextKey<never>, unknown>(
    options.provides?.map((e) => [e.key, e.value]),
  )
  const hasSeed = seed.size > 0

  async function fetch(req: Request): Promise<Response> {
    const pathname = pathnameOf(req.url)
    try {
      if (options.mcp && pathname === '/mcp') {
        if (req.method !== 'POST') {
          throw new HttpError(405, 'MCP HTTP transport accepts POST only')
        }
        let msg: unknown
        try {
          msg = await req.json()
        } catch {
          return Response.json(
            { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
            { status: 400 },
          )
        }
        const reply = await handleMcpMessage(app, msg as never)
        if (!reply) return new Response(null, { status: 202 })
        return Response.json(reply)
      }
      if (options.llms && pathname === '/llms.txt') {
        return new Response(renderLlmsTxt(routes, options.meta), {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        })
      }
      if (options.llms && pathname === '/llms-full.txt') {
        return new Response(renderLlmsFullTxt(routes, options.meta), {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        })
      }
      return await handle(req, new Ctx(req.signal, hasSeed ? seed : undefined))
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: err.message, details: err.details }, { status: err.status })
      }
      console.error(err)
      return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }

  const app: App = { routes, fetch }
  return app
}
