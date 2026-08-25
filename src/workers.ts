/**
 * Cloudflare Workers adapters.
 *
 * - `toWorker(app)`: plain HTTP passthrough. WebSockets work per-connection,
 *   but workerd ties each socket to its request's I/O context, so one
 *   connection CANNOT broadcast into another (sends from foreign contexts
 *   are silently dropped).
 * - `toDurableWorker(factory)`: the fix — the whole app (one Hub, Presence,
 *   SSE + WS + POST) lives inside a single Durable Object, so every
 *   connection shares one context exactly like Node/Bun. Requires declaring
 *   the DO in your wrangler config:
 *
 *     "durable_objects": {
 *       "bindings": [{ "name": "TZIN_APP", "class_name": "TzinChannels" }]
 *     },
 *     "migrations": [{ "tag": "v1", "new_sqlite_classes": ["TzinChannels"] }]
 */
import type { App } from './server.js'
import { createMatcher, type LookupResult } from './router.js'
import type { WsRoute, WsSend } from './ws.js'

interface CfWebSocket {
  accept(): void
  send(data: string): void
  close(code?: number, reason?: string): void
  addEventListener(type: 'message', cb: (ev: { data: unknown }) => void): void
  addEventListener(type: 'close', cb: () => void): void
  addEventListener(type: 'error', cb: () => void): void
}

interface DoNamespace {
  idFromName(name: string): unknown
  get(id: unknown): { fetch(req: Request): Promise<Response> | Response }
}

type Fetcher = { fetch(req: Request): Promise<Response> | Response }

export interface WorkerOptions {
  /** Native WebSocket endpoints served via WebSocketPair upgrades. */
  wsRoutes?: WsRoute[]
}

/* ------------------------------------------------------------------ */
/* Direct mode                                                         */
/* ------------------------------------------------------------------ */

export function toWorker(
  app: App,
  options: WorkerOptions = {},
): {
  fetch: (req: Request) => Promise<Response> | Response
} {
  const matcher = bindMatcher(options.wsRoutes)
  return {
    fetch: (req) => {
      if (isUpgrade(req)) {
        if (!matcher) return new Response('No WebSocket routes configured', { status: 404 })
        return upgrade(req, matcher)
      }
      return app.fetch(req)
    },
  }
}

/* ------------------------------------------------------------------ */
/* Durable Object mode: one context for every connection               */
/* ------------------------------------------------------------------ */

/** Default names; override via toDurableWorker options. */
export const DEFAULT_DO_BINDING = 'TZIN_APP'
export const DEFAULT_DO_CLASS = 'TzinChannels'

/** Factories registered by toDurableWorker(), consumed by the DO class. */
const factories = new Map<string, () => Fetcher>()
const apps = new Map<string, Fetcher>()

function appFor(className: string): Fetcher {
  let app = apps.get(className)
  if (!app) {
    const f = factories.get(className)
    if (!f) throw new Error(`No app factory registered for DO class "${className}"`)
    app = f()
    apps.set(className, app)
  }
  return app
}

/**
 * The whole app runs here — a single I/O context shared by every WebSocket,
 * SSE stream and HTTP request, so cross-connection broadcast just works.
 */
export class TzinChannels {
  async fetch(req: Request): Promise<Response> {
    return appFor(DEFAULT_DO_CLASS).fetch(req)
  }
}

export interface DurableWorkerOptions extends WorkerOptions {
  /** DO class name exported by this script (default "TzinChannels"). */
  className?: string
  /** Env binding name declared in wrangler config (default "TZIN_APP"). */
  binding?: string
}

export function toDurableWorker(
  factory: () => Fetcher,
  options: DurableWorkerOptions = {},
): {
  fetch: (req: Request, env?: Record<string, DoNamespace>) => Promise<Response> | Response
} {
  const className = options.className ?? DEFAULT_DO_CLASS
  const binding = options.binding ?? DEFAULT_DO_BINDING
  factories.set(className, factory)

  return {
    fetch: (req, env) => {
      const ns = env?.[binding]
      if (!ns) {
        return new Response(`Missing Durable Object binding "${binding}"`, { status: 500 })
      }
      // Singleton: every connection lands in the same DO instance/context.
      return ns.get(ns.idFromName('tzin-app')).fetch(req)
    },
  }
}

/* ------------------------------------------------------------------ */
/* Shared internals                                                    */
/* ------------------------------------------------------------------ */

function isUpgrade(req: Request): boolean {
  return req.headers.get('upgrade')?.toLowerCase() === 'websocket'
}

function bindMatcher(wsRoutes?: WsRoute[]): ((method: string, pathname: string) => LookupResult<WsRoute>) | undefined {
  const routes = wsRoutes ?? []
  return routes.length
    ? createMatcher(routes.map((r) => ({ method: 'GET', path: r.path, route: r })))
    : undefined
}

function pairCtor():
  | (new () => Record<0 | 1, CfWebSocket>)
  | undefined {
  return (globalThis as Record<string, unknown>).WebSocketPair as
    | (new () => Record<0 | 1, CfWebSocket>)
    | undefined
}

function upgrade(
  req: Request,
  matcher: (method: string, pathname: string) => LookupResult<WsRoute>,
): Promise<Response> | Response {
  const Pair = pairCtor()
  if (!Pair) return new Response('WebSockets require a Workers-compatible runtime', { status: 500 })

  let url: URL
  try {
    url = new URL(req.url)
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const hit = matcher('GET', url.pathname)
  if (!hit || !('route' in hit)) {
    return new Response('WebSocket upgrade failed', { status: 400 })
  }
  const route = hit.route

  const pair = new Pair()
  const client = pair[0]
  const server = pair[1]

  // accept() must precede any send(); early sends are buffered until the
  // 101 response reaches the runtime.
  server.accept()
  const send: WsSend = (frame) => {
    try {
      server.send(JSON.stringify(frame))
    } catch {}
  }

  let state: unknown
  try {
    state = route.open(send, url)
  } catch {
    server.close(1011, 'handler error')
    return new Response('WebSocket handler failed', { status: 500 })
  }

  server.addEventListener('message', (ev) => {
    const text = typeof ev.data === 'string' ? ev.data : String(ev.data)
    try {
      route.message(state, text)
    } catch {}
  })
  const closeAll = (): void => {
    try {
      route.close(state)
    } catch {}
  }
  server.addEventListener('close', closeAll)
  server.addEventListener('error', closeAll)

  // The response carries the CLIENT side back to the runtime (101 required).
  return new Response(null, { status: 101, webSocket: client } as unknown as ResponseInit)
}
