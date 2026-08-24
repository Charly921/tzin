/**
 * Bun adapter. NOTE: authored against Bun's documented `Bun.serve` API;
 * verified locally on Bun 1.4.0 for plain HTTP (examples/bun-demo.ts).
 */
import type { App } from './server.js'
import { createMatcher } from './router.js'
import type { WsRoute } from './ws.js'

interface BunWsData {
  route?: WsRoute
  url?: URL
  state?: unknown
}

interface BunWs {
  data: BunWsData
  send(data: string): unknown
  close(): unknown
}

declare const Bun: {
  serve(options: {
    port?: number
    fetch: (
      req: Request,
      server?: { upgrade(req: Request, opts?: { data?: unknown }): boolean },
    ) => Response | Promise<Response> | undefined
    websocket?: {
      open(ws: BunWs): void
      message(ws: BunWs, message: string | Buffer): void
      close(ws: BunWs): void
    }
  }): unknown
}

export function serve(app: App, port = 3000, options: { wsRoutes?: WsRoute[] } = {}): void {
  const wsRoutes = options.wsRoutes ?? []
  const matcher = wsRoutes.length
    ? createMatcher(wsRoutes.map((r) => ({ method: 'GET', path: r.path, route: r })))
    : undefined

  Bun.serve({
    port,
    fetch: (req, server) => {
      if (matcher && req.headers.get('upgrade')?.toLowerCase() === 'websocket' && server) {
        const url = new URL(req.url)
        const hit = matcher('GET', url.pathname)
        if (hit && 'route' in hit) {
          const upgraded = server.upgrade(req, { data: { route: hit.route as WsRoute, url } })
          if (upgraded) return undefined
        }
        return new Response('WebSocket upgrade failed', { status: 400 })
      }
      return app.fetch(req)
    },
    ...(wsRoutes.length
      ? {
          websocket: {
            open(ws) {
              const { route, url } = ws.data
              if (!route || !url) return
              ws.data.state = route.open((frame) => ws.send(JSON.stringify(frame)), url)
            },
            message(ws, message) {
              const { route } = ws.data
              if (route && ws.data.state !== undefined) {
                route.message(ws.data.state, String(message))
              }
            },
            close(ws) {
              const { route } = ws.data
              if (route && ws.data.state !== undefined) route.close(ws.data.state)
            },
          } satisfies {
            open(ws: BunWs): void
            message(ws: BunWs, message: string | Buffer): void
            close(ws: BunWs): void
          },
        }
      : {}),
  })
}
