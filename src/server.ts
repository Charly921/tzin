import { Value } from './schema.js'
import { HttpError, type RouteImpl } from './contract.js'
import { matchPath } from './router.js'

export interface App {
  routes: RouteImpl<any>[]
  fetch(req: Request): Promise<Response>
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
export function createApp(routes: RouteImpl<any>[]): App {
  async function fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)

    for (const route of routes) {
      const c = route.contract
      if (c.method !== req.method) continue
      const params = matchPath(c.path, url.pathname)
      if (!params) continue

      try {
        const input: Record<string, unknown> = {}

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
        return Response.json(result.body, { status: result.status })
      } catch (err) {
        if (err instanceof HttpError) {
          return Response.json({ error: err.message, details: err.details }, { status: err.status })
        }
        console.error(err)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
      }
    }

    return Response.json({ error: 'Not Found' }, { status: 404 })
  }

  return { routes, fetch }
}
