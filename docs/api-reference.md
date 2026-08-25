# API Reference

Complete reference for all `@carlos-tzin/tzin` exports.

## Core

### `contract(def)`

Define an endpoint contract. Returns the same object with preserved literal types.

```ts
const getUser = contract({
  method: 'GET',
  path: '/users/:id',
  name: 'get_user',           // optional: used for OpenAPI operationId and MCP tool name
  description: 'Look up a user', // optional: surfaced in OpenAPI and MCP
  params: t.Object({ id: t.String() }),
  query: t.Object({ fields: t.Optional(t.Array(t.String())) }),
  responses: {
    200: t.Object({ id: t.String(), name: t.String() }),
    404: t.Object({ error: t.String() }),
  },
})
```

**Options:**

| Property | Type | Required | Description |
|---|---|---|---|
| `method` | `'GET' \| 'POST' \| 'PUT' \| 'PATCH' \| 'DELETE' \| 'HEAD' \| 'OPTIONS'` | Yes | HTTP method |
| `path` | `string` | Yes | Path with `:param` placeholders |
| `name` | `string` | No | Stable identifier for OpenAPI/MCP |
| `description` | `string` | No | Human/agent-readable summary |
| `params` | `TSchema` | No | Path parameters schema |
| `query` | `TSchema` | No | Query string schema |
| `body` | `TSchema` | No | Request body schema |
| `headers` | `TSchema` | No | Request headers schema |
| `cookies` | `TSchema` | No | Request cookies schema |
| `responses` | `Record<number, TSchema>` | Yes | Response schemas by status code |

---

### `impl(contract, handler)`

Bind an implementation to a contract. The compiler validates input/output types.

```ts
const getUserRoute = impl(getUser, async ({ params, query, ctx }) => {
  const user = await findUser(params.id)
  if (!user) throw new HttpError(404, 'user not found')
  return { status: 200 as const, body: user }
})
```

**Handler input:**

| Property | Type | Description |
|---|---|---|
| `ctx` | `Ctx` | Request context (signal, require, get, set) |
| `params` | Inferred from contract | Path parameters (if declared) |
| `query` | Inferred from contract | Query parameters (if declared) |
| `body` | Inferred from contract | Request body (if declared) |
| `headers` | Inferred from contract | Request headers (if declared) |
| `cookies` | Inferred from contract | Request cookies (if declared) |

---

### `HttpError`

Thrown inside handlers to return error responses.

```ts
throw new HttpError(404, 'not found')
throw new HttpError(400, 'invalid input', { details: [...] })
throw new HttpError(403, 'forbidden', undefined, { 'X-Reason': 'denied' })
```

```ts
class HttpError extends Error {
  constructor(
    status: number,
    message: string,
    details?: unknown,
    headers?: Record<string, string>,
  )
}
```

---

### `raw(response)`

Escape hatch to return a pre-built `Response` (streaming, files, proxies).

```ts
return raw(new Response(stream, { status: 200 }))
return raw(new Response(null, { status: 204 }))
```

---

## App

### `createApp(routes, options?)`

Create an application from route implementations.

```ts
const app = createApp([getUserRoute, createUsersRoute], {
  middleware: [authMiddleware, corsMiddleware],
  provides: [{ key: dbKey, value: database }],
  mcp: true,      // POST /mcp (Streamable HTTP)
  llms: true,     // GET /llms.txt, /llms-full.txt
  openapi: true,  // GET /openapi.json
  meta: { title: 'My API', version: '1.0.0' },
})
```

**Options:**

| Property | Type | Default | Description |
|---|---|---|---|
| `middleware` | `Middleware[]` | `[]` | Onion-style middleware stack |
| `provides` | `ProvidedEntry[]` | `[]` | DI seeds for request context |
| `mcp` | `boolean` | `false` | Enable MCP Streamable HTTP at `POST /mcp` |
| `llms` | `boolean` | `false` | Enable `/llms.txt` and `/llms-full.txt` |
| `openapi` | `boolean` | `false` | Enable `/openapi.json` (OpenAPI 3.1) |
| `meta` | `ApiMeta` | `{}` | API metadata for OpenAPI/MCP |

**Returns:** `App` with `fetch(req)` method.

---

## Client

### `client(routes, baseUrl?)`

Create a typed client from contracts.

```ts
const api = client({ getUser, createUser }, 'https://api.example.com')

const res = await api.getUser({ params: { id: 'u1' } })
if (res.status === 200) {
  res.body.name // string
} else {
  res.body.error // string
}
```

**Types:**

```ts
type ClientOf<Routes> = { [K in keyof Routes]: CallerFn<Routes[K]> }
type ClientResult<C> = { status: number; body: unknown } // discriminated union
type CallerFn<C> = (input: SectionsOf<C>) => Promise<ClientResult<C>>
```

---

## Schema

### `t`

Re-export of `@sinclair/typebox`. Use for defining schemas.

```ts
import { t } from '@carlos-tzin/tzin'

t.String()
t.Number()
t.Boolean()
t.Array(t.String())
t.Object({ id: t.String(), name: t.String() })
t.Optional(t.String())
t.Union([t.Literal('a'), t.Literal('b')])
```

### `Value`

Re-export of `@sinclair/typebox/value`. Use for runtime validation.

```ts
import { Value } from '@carlos-tzin/tzin'

Value.Check(schema, data) // boolean
Value.Errors(schema, data) // iterator of errors
```

---

## Context

### `defineContext<T>()`

Create a typed context key for dependency injection.

```ts
const dbKey = defineContext<Database>('db')
```

### `ctx`

Request context available in handlers and middleware.

| Method | Description |
|---|---|
| `ctx.signal` | `AbortSignal` for the request |
| `ctx.get(key)` | Get a value from context |
| `ctx.require(key)` | Get a value or throw if missing |
| `ctx.set(key, value)` | Set a value in context |

---

## Middleware

### `middleware(fn)`

Define an onion-style middleware.

```ts
const authMiddleware = middleware(async (ctx, next) => {
  const token = ctx.headers?.authorization
  if (!token) throw new HttpError(401, 'unauthorized')
  ctx.set('user', await verifyToken(token))
  return next()
})
```

### `compose(middlewares)`

Compose multiple middleware into a single function (used internally by `createApp`).

---

## DI

### `provide(key, value)`

Create a DI entry to seed into request context.

```ts
const app = createApp(routes, {
  provides: [
    provide(dbKey, database),
    provide(configKey, config),
  ],
})
```

---

## Realtime

### `Hub`

In-memory pub/sub hub for channels.

```ts
const hub = new Hub()
const hubWithBus = new Hub({ bus: redisBus }) // multi-node
```

### `Presence`

TTL-based presence tracking (Phoenix-style).

```ts
const presence = new Presence(hub, 30_000) // 30s TTL
```

### `channelRoutes(hub, options?)`

Generate mountable channel routes (SSE + POST).

```ts
const app = createApp([
  ...channelRoutes(hub, { presence }),
])
// GET  /channels/:topic?member=alice  → SSE stream
// POST /channels/:topic               → broadcast
// POST /channels/:topic/heartbeat     → refresh presence
// POST /channels/:topic/leave         → leave presence
```

### `wsChannels(hub, options?)`

WebSocket channel adapter (Node/Bun/Workers).

```ts
import { wsChannels } from '@carlos-tzin/tzin/ws'
```

### `attachChannels(server, routes)`

Attach WebSocket channels to a Node.js server.

```ts
import { attachChannels } from '@carlos-tzin/tzin/ws-node'

const server = await listen(app, 3000)
attachChannels(server, [wsChannels(hub, { presence })])
```

### `LocalBus`

In-memory message bus for single-process use.

### `clusterHubs(bus, count)`

Create multiple interconnected hubs for testing multi-node setups.

---

## Browser Client

### `joinChannel(baseUrl, topic, options)`

Zero-dependency browser client for channels.

```ts
import { joinChannel } from '@carlos-tzin/tzin/client-browser'

const chat = joinChannel('https://api.example.com', 'lobby', { member: 'ada' })
chat.on('message', (data) => render(data))
chat.on('presence_diff', (d) => updateRoster(d))
await chat.push('message', { text: 'hello' })
```

**Options:**

| Property | Type | Default | Description |
|---|---|---|---|
| `member` | `string` | - | Member name for presence |
| `heartbeatMs` | `number` | `15000` | Heartbeat interval |
| `eventSource` | `EventSource` | global | Custom EventSource (for polyfills) |

---

## SSE

### `sse(producer, signal?)`

Create a streaming SSE response.

```ts
return sse(async function* ({ signal }) {
  while (!signal.aborted) {
    yield { event: 'tick', data: Date.now() }
    await new Promise((r) => setTimeout(r, 1000))
  }
})
```

---

## Runtimes

### `listen(app, port?)`

Start a Node.js HTTP server.

```ts
const server = await listen(app, 3000)
```

### `serveBun(app, port?)`

Start a Bun server.

```ts
import { serveBun } from '@carlos-tzin/tzin'
serveBun(app, 3000)
```

### `toWorker(app, options?)`

Create a Cloudflare Workers handler.

```ts
export default toWorker(app)
```

### `toDurableWorker(factory, options?)`

Create a Durable Object-backed Workers handler (for WebSockets).

```ts
export default toDurableWorker(() => {
  const hub = new Hub()
  const app = createApp([...routes, ...channelRoutes(hub)])
  return toWorker(app, { wsRoutes: [wsChannels(hub)] })
})
```

---

## CORS

### `cors(options?)`

CORS middleware.

```ts
import { cors } from '@carlos-tzin/tzin'

const app = createApp(routes, {
  middleware: [cors({ origin: '*' })],
})
```

**Options:**

| Property | Type | Default | Description |
|---|---|---|---|
| `origin` | `string \| string[] \| '*'>` | `'*'` | Allowed origins |
| `methods` | `string[]` | `['GET','POST','PUT','PATCH','DELETE']` | Allowed methods |
| `headers` | `string[]` | `[]` | Allowed headers |
| `credentials` | `boolean` | `false` | Allow credentials |
| `maxAge` | `number` | `86400` | Preflight cache (seconds) |

---

## MCP

### `startStdioMcp(app)`

Start an MCP server over stdio (newline-delimited JSON-RPC).

```ts
import { startStdioMcp } from '@carlos-tzin/tzin'

startStdioMcp(app)
```

### `handleMcpMessage(app, message)`

Handle a single MCP JSON-RPC message (for custom transports).

---

## OpenAPI

### `generateOpenApi(routes, meta?)`

Generate an OpenAPI 3.1 document from contracts.

```ts
const spec = generateOpenApi(routes, { title: 'My API', version: '1.0.0' })
```

---

## Types

| Type | Description |
|---|---|
| `HttpMethod` | `'GET' \| 'POST' \| 'PUT' \| 'PATCH' \| 'DELETE' \| 'HEAD' \| 'OPTIONS'` |
| `ContractDef` | Contract definition shape |
| `AnyContract` | Alias for `ContractDef` |
| `SectionsOf<C>` | Request sections inferred from contract |
| `HandlerInput<C>` | Handler input: sections + ctx |
| `ResponseOf<C>` | Response union inferred from contract |
| `RouteImpl<C>` | `{ contract, handler }` |
| `App` | Application with `fetch(req)` method |
| `ClientOf<Routes>` | Typed client from contracts |
| `ClientResult<C>` | Client response union |
| `CallerFn<C>` | Client caller function |
| `Middleware` | Middleware function type |
| `Ctx` | Request context |
| `ContextKey<T>` | Typed context key |
| `Hub` | Pub/sub hub |
| `Presence` | Presence tracker |
| `MessageBus` | Bus interface for multi-node |
| `MemberInfo` | Presence member info |
| `RawResult` | Raw response wrapper |
| `SseSender` | SSE producer function |
