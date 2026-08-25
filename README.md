# tzin

**Contract-first TypeScript framework. Types that scale.**

> `tzin` — from Nahuatl *-tzin*, an honorific suffix for what is valued and beloved.
> A pact between client and server, declared once.

**Status: experimental spike.** The core works end-to-end and the scaling thesis is
measured (see [Benchmarks](#benchmarks)), but this is not yet production software.

## Why another framework?

The TypeScript backend landscape is crowded — and still leaves real gaps:

| Gap | Evidence |
|---|---|
| Type inference collapses at scale | Hono issues [#2399](https://github.com/honojs/hono/issues/2399), [#3869](https://github.com/honojs/hono/issues/3869); chained route builders force one giant expression per app |
| No architecture in lightweight frameworks | Hono issue [#4121](https://github.com/honojs/hono/issues/4121) |
| Extractors don't exist in TS | Only Rust's Axum gets handler input right |
| OpenAPI is a bolt-on | Every TS framework translates its own schema DSL to JSON Schema at runtime or via codegen |
| AI-native toolchain | One framework ships an MCP server; the window is closing |

tzin's answer: **declare a contract once**, get everything else for free.

```ts
import { t } from 'tzin'
import { contract, impl, createApp } from 'tzin'

const getUser = contract({
  method: 'GET',
  path: '/users/:id',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ id: t.String(), name: t.String(), tags: t.Array(t.String()) }),
    404: t.Object({ error: t.String() }),
  },
})

export const getUserRoute = impl(getUser, async ({ params }) => {
  const user = await findUser(params.id)
  if (!user) throw new HttpError(404, 'user not found')
  return { status: 200, body: user }
})
```

From that single declaration:

- **Handler input is extracted, not guessed**: `{ params }` exists because you declared
  it; add `query`, `body`, `headers` or `cookies` to the contract and they appear,
  fully typed and validated per request (cookies are parsed from the header).
- **The compiler enforces your responses**: returning a shape that doesn't match the
  declared `200` body is a type error. Thrown `HttpError`s map to their status.
- **OpenAPI 3.1 is free**: contracts are JSON Schema (TypeBox), so
  `generateOpenApi(routes)` needs no translation layer.

### Server

Web Standards all the way down — an app is just `fetch(req): Promise<Response>`,
testable without a socket, deployable on Node, Bun, or edge workers:

```ts
const app = createApp([getUserRoute])

// Node
listen(app, 3000)
// Anywhere else
export default { fetch: app.fetch }
```

### Typed client

One call, fully inferred — statuses are a discriminated union:

```ts
const api = client({ getUser }, 'https://api.example.com')

const res = await api.getUser({ params: { id: 'u1' } })
if (res.status === 200) {
  res.body.name // string
} else {
  res.body.error // string
}
```

## Benchmarks

100 endpoints with distinct schemas, checked by `tsc --extendedDiagnostics`
(generate with `node scripts/gen-fixtures.mjs <N>`):

| N routes | tzin: types | Hono: types | tzin: instantiations | Hono: instantiations | Check tzin / hono |
|---|---|---|---|---|---|
| 20 | 4,851 | 72,368 | 22,472 | 156,054 | 0.25s / 0.31s |
| 100 | 15,779 | 111,952 | 93,128 | 240k | 0.53s / 0.55s |
| 300 | 43,099 | 210,912 | 270k | 590k | 1.13s / 1.34s |

tzin grows **strictly linearly** (~130 types/endpoint). Two structural findings about
the chained-builder model this measures against:

1. Route chains must live in a **single expression** — write routes as separate
   statements and `typeof app` silently loses every route (intermediate types only
   flow through the chain).
2. Registering the same path twice **silently degrades client typing**.

A flat registry of plain objects has neither failure mode by construction.

*Honest caveat: the Hono fixture returns constant JSON without validators; the
documented blow-ups compound further when `zValidator` inference enters the chain.*

### Runtime throughput

100 routes · `GET /r50/item` · 64 connections · 5s (`npm run bench:http`, autocannon,
each framework in its own process, 3 rotated rounds, median — order rotates so
machine drift can't bias any variant; tzin runs from built `dist/`):

| Framework | req/s | p99 |
|---|---|---|
| raw node:http (floor) | ~42k | 2–3ms |
| hono | ~34–36k | 3ms |
| tzin | ~30–31k | 6ms |
| express | ~15k | 7ms |

The honest decomposition (`npm run bench:pipeline`, in-process `app.fetch` with
identical request construction):

| Metric | tzin | hono |
|---|---|---|
| in-process dispatch | ~127k req/s | ~118k req/s |

Framework-side, tzin matches hono (routing is a radix trie at 9.1M lookups/s,
full TypeBox validation costs ≈0.05µs/request). The Node adapter duck-types
requests, memoizes route matches per `METHOD path`, keeps the abort signal lazy
(wired only if something reads `ctx.signal`), and skips undici Response
construction entirely on the JSON hot path via `app.dispatchRaw` — tzin lands
at ~0.9x of hono over the network.

## AI-native: every API is an MCP server

tzin ships first-class [MCP](https://modelcontextprotocol.io) support — the same
contracts that generate your OpenAPI document also expose your endpoints as tools
for AI agents:

```ts
import { startStdioMcp } from 'tzin'

const app = createApp(routes)
startStdioMcp(app) // newline-delimited JSON-RPC on stdio
```

- `tools/list` returns each endpoint with a real JSON Schema `inputSchema` assembled
  from its declared sections — **no conversion layer**, TypeBox already is JSON Schema.
- `tools/call` dispatches **in-process** through the full app: validation, middleware
  and DI all apply; HTTP errors surface as `isError` results.
- Contract-level `name` and `description` become the tool's identity; OpenAPI reuses
  them as `operationId`/`description`.

Prefer HTTP? Enable the Streamable HTTP transport on the same app:

```ts
const app = createApp(routes, { mcp: true }) // POST /mcp speaks JSON-RPC
```

And give LLMs a map of your API straight from the contracts:

```ts
const app = createApp(routes, {
  llms: true,
  openapi: true,
  meta: { title: 'My API' },
})
// GET /llms.txt       — index of endpoints (method, path, name, description)
// GET /llms-full.txt  — same index plus every declared JSON Schema inline
// GET /openapi.json   — OpenAPI 3.1 document (TypeBox == JSON Schema == OpenAPI)
```

## Realtime channels with presence

Phoenix-style channels, mounted as ordinary routes — SSE down, POST up, so it
runs on every runtime including Workers:

```ts
import { Hub, Presence, channelRoutes } from 'tzin'

const hub = new Hub()
const presence = new Presence(hub, 30_000)

const app = createApp(channelRoutes(hub, { presence }))
// GET  /channels/:topic?member=alice   → SSE stream; presence joins
// POST /channels/:topic                → { event, data } broadcast
// POST /channels/:topic/heartbeat      → keep member listed (TTL-refreshed)
// POST /channels/:topic/leave          → presence_diff broadcast
```

Members that stop heartbeating are swept and announced via `presence_diff` —
ghost clients disappear even after crashes. The in-memory `Hub` is one process;
multi-node deployments wire hubs together over a message bus:

```ts
import { Hub } from 'tzin'
import { LocalBus } from 'tzin/bus'

// Any PUBLISH/SUBSCRIBE transport maps onto this 2-method interface:
const bus: MessageBus = redisPubSubAdapter // Redis, Postgres LISTEN/NOTIFY...

const nodeA = new Hub({ bus })
const nodeB = new Hub({ bus })
// A publish on node A reaches subscribers of every node; own frames are
// ignored, so there is no echo. Bus subscriptions are per-topic and lazy.
```

Presence replicates Phoenix-style: every node merges remote join/leave/sweep
frames into its local view, so `presence_state` snapshots are complete
cluster-wide, subscribers get the full roster on connect, and ghosts left by a
dead node are expired by any surviving node's TTL sweep.

A zero-dependency client ships for browsers (and Node >= 22 with any
EventSource polyfill) — auto-heartbeat, presence events and reconnection via
the platform's EventSource:

```ts
import { joinChannel } from 'tzin/client-browser'

const chat = joinChannel('https://api.example.com', 'lobby', { member: 'ada' })
chat.on('message', (data) => render(data))
chat.on('presence_diff', (d) => updateRoster(d))
await chat.push('message', { text: 'hello' })
```

### Native WebSockets

Prefer WebSockets over SSE+POST? The same Hub and Presence power a WS route —
one protocol implementation, thin per-runtime adapters:

```ts
import { wsChannels } from 'tzin/ws'
import { attachChannels } from 'tzin/ws-node' // Node adapter (ws package)
// Bun: serve(app, port, { wsRoutes: [wsChannels(hub, { presence })] })

const server = await listen(createApp(routes), 3000)
attachChannels(server, [wsChannels(hub, { presence })])
// ws://host/channels/:topic?member=ada — frames: {type:'push'|'heartbeat'}, receive {event,data}
```

On Cloudflare Workers, run the whole app inside a Durable Object so every
connection shares one I/O context — cross-connection broadcast then behaves
exactly like Node/Bun (workerd drops sends that come from another request's
context, which is why plain fetch handlers can't relay between sockets):

```ts
import { toDurableWorker, toWorker, TzinChannels } from 'tzin'
import { Hub, Presence, channelRoutes, wsChannels, createApp } from 'tzin'

export { TzinChannels } // workerd discovers DO classes among exports

export default toDurableWorker(() => {
  const hub = new Hub()
  const presence = new Presence(hub)
  const app = createApp([...routes, ...channelRoutes(hub, { presence })])
  return toWorker(app, { wsRoutes: [wsChannels(hub, { presence })] })
})
```

```jsonc
// wrangler config additions:
"durable_objects": {
  "bindings": [{ "name": "TZIN_APP", "class_name": "TzinChannels" }]
},
"migrations": [{ "tag": "v1", "new_sqlite_classes": ["TzinChannels"] }]
```

Verified against real workerd via miniflare (`npm run probe:workers`):
HTTP ✓, WS upgrade ✓, roster ✓, broadcast across connections ✓, leave diff ✓.

## Design principles

- **Contract-first, flat registry.** A route is data (`contract({...})`), not a link
  in a builder chain. Inference cost stays O(1) per endpoint.
- **JSON Schema native.** TypeBox schemas double as OpenAPI with zero conversion.
- **Web Standards runtime.** `Request` in, `Response` out; adapters stay thin.
- **Extractors over magic.** Handlers receive exactly what the contract declares.
- **Errors are control flow.** Throw typed errors; the response union already knows.
- **Light DI without ceremony.** `provide(key, value)` at app level seeds typed
  singletons into every request's context — handlers just `ctx.require(db)`.
  Request-scoped middleware can override. No decorators, no reflection, no
  container configuration files.

## Roadmap

- [x] Spike: contracts, router, server, typed client, OpenAPI generation
- [x] Middleware composition (onion-style) with typed per-request context
- [x] Adapters: Node (listen + streaming SSE), Bun (verified e2e), Workers (HTTP + DO-backed WebSockets, verified via miniflare/workerd)
- [x] Streaming/SSE (`sse()` helper + `raw()` escape hatch)
- [x] Realtime: Hub (pub/sub), Presence (TTL + diffs), mountable channel routes
- [ ] Streaming/SSE
- [x] Optional light DI layer (`provide()` → typed singleton seeds in request context)
- [x] AI-native toolchain: built-in MCP server (`tools/list`, `tools/call`, stdio transport)

## Development

```sh
npm install
npm test          # vitest — runtime + end-to-end client + type assertions
npm run typecheck # strict tsc across src/test/bench fixtures
```

### Dev server

```sh
npx tsx src/cli.ts dev examples/node-demo.ts --port 3000
```

Hot-reloading server (tsx watch) that prints your route table straight from the
contracts on every reload:

```
tzin dev · 2 routes

  GET     /users/:id        get_user   Look up a user by id
  POST    /users            create_user
```

## License

MIT — see [LICENSE](./LICENSE).
