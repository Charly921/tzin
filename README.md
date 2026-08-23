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
  it; add `query` or `body` to the contract and they appear, fully typed.
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
- [ ] Adapters: Node (done, minimal), Workers (done), Bun (written against documented API, unverified)
- [x] Streaming/SSE (`sse()` helper + `raw()` escape hatch)
- [ ] Streaming/SSE
- [x] Optional light DI layer (`provide()` → typed singleton seeds in request context)
- [x] AI-native toolchain: built-in MCP server (`tools/list`, `tools/call`, stdio transport)

## Development

```sh
npm install
npm test          # vitest — runtime + end-to-end client + type assertions
npm run typecheck # strict tsc across src/test/bench fixtures
```

## License

MIT (pending)
