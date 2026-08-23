import type { AnyContract, HandlerInput, ResponseOf } from './contract.js'

export interface CallerResult<C extends AnyContract> {
  status: number
  data: ResponseOf<C>['body'] | { error: string; details?: unknown }
}

export type CallerFn<C extends AnyContract> = (
  input: HandlerInput<C> & { fetchInit?: RequestInit },
) => Promise<CallerResult<C>>

/** Flat mapped type over a record of contracts: O(routes), no nesting. */
export type ClientOf<Routes extends Record<string, AnyContract>> = {
  [K in keyof Routes]: CallerFn<Routes[K]>
}

export function client<Routes extends Record<string, AnyContract>>(
  routes: Routes,
  baseUrl = '',
): ClientOf<Routes> {
  return new Proxy({} as ClientOf<Routes>, {
    get(_target, key: string | symbol) {
      if (typeof key !== 'string' || !(key in routes)) return undefined
      const c = routes[key]
      return async (input: Record<string, any> = {}) => {
        let path = c.path.replace(/:([A-Za-z0-9_]+)/g, (_m, name) =>
          encodeURIComponent(String(input.params?.[name] ?? `{${name}}`)),
        )
        if (input.query) {
          const qs = new URLSearchParams(
            Object.entries(input.query).map(([k, v]) => [k, String(v)]),
          ).toString()
          if (qs) path += `?${qs}`
        }
        const init: RequestInit = { method: c.method, ...input.fetchInit }
        if ('body' in c && c.body) init.body = JSON.stringify(input.body)
        const res = await fetch(baseUrl + path, init)
        let data: unknown
        try {
          data = await res.json()
        } catch {
          data = null
        }
        return { status: res.status, data }
      }
    },
  })
}
