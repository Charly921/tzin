# Changelog

## 0.1.0 — first public release

Contract-first TypeScript framework: declare a contract once, get the typed
handler, the typed client, OpenAPI 3.1, MCP tools and realtime channels.

### Core

- `contract()` / `impl()` — flat route registry with O(1) inference per endpoint
- Extractor-style handler input: `params`, `query`, `body`, `headers`, `cookies`
  (declared sections only, validated per request via TypeBox)
- Status-discriminated response unions enforced by the compiler
- `HttpError` → mapped to declared statuses; middleware can catch and transform
- Onion-style middleware with typed per-request context (`defineContext`/`ctx.require`)
- Light DI: `provide(key, value)` seeds typed singletons into request context
- Radix-trie router (9.1M lookups/s), static beats param, order-stable tiebreak

### Runtimes

- Node (`listen()` — optimized adapter with streaming SSE + WebSockets)
- Bun (`serveBun()` — native `Bun.serve` websockets)
- Cloudflare Workers (`toWorker()`, channels inside a Durable Object via
  `TzinChannels`; verified against real workerd through miniflare)

### Realtime

- Channels mounted as ordinary routes: SSE down / POST up on every runtime,
  or native WebSockets (`wsChannels` + `attachChannels` / Bun / Workers DO)
- Presence with TTL, heartbeats and sweep — ghosts disappear even after crashes
- Multi-node: wire hubs over any `MessageBus` (Redis PUBLISH/SUBSCRIBE,
  Postgres LISTEN/NOTIFY, Durable Objects); no echo, lazy per-topic subscriptions
- Zero-dependency browser client: `joinChannel` with auto-heartbeat

### AI-native

- MCP server over stdio (`startStdioMcp`) and Streamable HTTP (`{ mcp: true }`)
- `tools/list` / `tools/call` dispatch in-process through validation, middleware
  and DI; HTTP errors surface as `isError` results
- `/llms.txt` + `/llms-full.txt` generated from contracts (`{ llms: true }`)
- OpenAPI 3.1 generation with zero schema conversion (TypeBox is JSON Schema)

### Developer experience

- Typed client with status narrowing: `if (res.status === 200) res.body...`
- Dev server with hot reload printing the route table from contracts
- CORS as onion middleware: wildcard or reflected origins, allow-lists,
  credentials-safe (never combines `*` with credentials), preflight
  short-circuit before routing
