import { Value } from './schema.js'
import { HttpError, isRawResult, type RouteImpl } from './contract.js'
import { matchPath } from './router.js'
import { Ctx, type ContextKey } from './context.js'
import { compose, type Middleware } from './middleware.js'
import type { ProvidedEntry } from './provide.js'

export interface App {
  routes: RouteImpl<any>[]
  fetch(req: Request): Promise<Response>
}

export interface AppOptions {
  middleware?: Middleware[]
  provides?: ProvidedEntry[]
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
export function createApp(routes: RouteImpl<any>[], options: AppOptions = {}): App {
  async function dispatch(req: Request, ctx: Ctx): Promise<Response> {
    const url = new URL(req.url)

    for (const route of routes) {
      const c = route.contract
      if (c.method !== req.method) continue
      const params = matchPath(c.path, url.pathname)
      if (!params) continue

      const input: Record<string, unknown> = { ctx }

      if ('params' in c && c.params) {
        check('path params', c.params, params)
        input.params = params
      }

      if ('query' in c && c.query) {
        const rawQuery = Object.fromEntries(url.searchParams.entries())
        check('query', c.query, rawQuery)
        input.query = rawQuery
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

      const result = await route.handler(input as never)
      if (isRawResult(result)) return result.__tzin_raw
      return Response.json(result.body, { status: result.status })
    }

    throw new HttpError(404, 'Not Found')
  }

  const handle = compose(options.middleware ?? [], dispatch)
  const seed = new Map<ContextKey<never>, unknown>(
    options.provides?.map((e) => [e.key, e.value]),
  )

  async function fetch(req: Request): Promise<Response> {
    try {
      return await handle(req, new Ctx(req.signal, seed))
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: err.message, details: err.details }, { status: err.status })
      }
      console.error(err)
      return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }

  return { routes, fetch }
}
