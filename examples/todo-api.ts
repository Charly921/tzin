/**
 * Production-shaped example: authenticated TODO API.
 *
 * Exercises the whole framework story in one runnable file:
 * - Contracts -> typed handlers, automatic validation
 * - Auth as onion middleware + typed context (DI between middleware & handlers)
 * - App-scoped dependency injection (provide)
 * - One app = HTTP API + OpenAPI 3.1 (/openapi.json) + LLM maps (/llms.txt)
 *   + MCP server (POST /mcp) generated from the same contracts
 *
 * Run:  npx tsx examples/todo-api.ts
 * Try:  curl -X POST localhost:4644/auth/login -H 'content-type: application/json' -d '{"username":"ada","password":"lovelace"}'
 *       curl localhost:4644/openapi.json | head -40
 *       curl -X POST localhost:4644/mcp -H 'content-type: application/json' \
 *         -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
 */
import { createHmac, randomUUID } from 'node:crypto'
import { t } from '../src/schema.js'
import {
  contract,
  impl,
  HttpError,
  createApp,
  middleware,
  defineContext,
  provide,
  type Ctx,
} from '../src/index.js'

// ---------------------------------------------------------------------------
// 1. App-scoped dependency injection: the store is seeded into every request.
//    Swap the Map for Postgres and no handler changes.
// ---------------------------------------------------------------------------
interface Todo {
  id: string
  owner: string
  title: string
  done: boolean
}

const StoreKey = defineContext<{ todos: Map<string, Todo> }>('store')
const store = { todos: new Map<string, Todo>() }

const SecretKey = defineContext<{ secret: string }>('secret')
const SECRET = 'dev-secret-change-me'

// ---------------------------------------------------------------------------
// 2. Auth primitives: HMAC-signed tokens, no dependencies.
// ---------------------------------------------------------------------------
interface Claims {
  sub: string
  exp: number
}

function sign(payload: Claims): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const mac = createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${mac}`
}

function verify(token: string): Claims {
  const [body, mac] = token.split('.')
  const expected = createHmac('sha256', SECRET).update(body ?? '').digest('base64url')
  if (!body || !mac || mac.length !== expected.length || !timingSafeEqual(mac, expected)) {
    throw new HttpError(401, 'Invalid token', undefined)
  }
  const claims = JSON.parse(Buffer.from(body, 'base64url').toString()) as Claims
  if (Date.now() > claims.exp) throw new HttpError(401, 'Token expired', undefined)
  return claims
}

function timingSafeEqual(a: string, b: string): boolean {
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const USERS = new Map([
  // demo credentials only — never do this outside an example
  ['ada', 'lovelace'],
  ['grace', 'hopper'],
])

// The identity of the caller, set by authMiddleware, read by handlers.
export const CurrentUser = defineContext<string>('currentUser')

// ---------------------------------------------------------------------------
// 3. Onion middleware: logging (outermost) then auth (inner).
// ---------------------------------------------------------------------------
const logger = middleware(async ({ req, next }) => {
  const start = Date.now()
  const res = await next()
  console.log(`${req.method} ${new URL(req.url).pathname} -> ${res.status} (${Date.now() - start}ms)`)
  return res
})

/** Routes registered after this one still run it; public paths opt out below. */
const auth = middleware(async ({ req, ctx, next }) => {
  const path = new URL(req.url).pathname
  if (path === '/health' || path === '/auth/login') return next()

  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw new HttpError(401, 'Missing bearer token', undefined)
  const claims = verify(token)
  ctx.set(CurrentUser, claims.sub)
  return next()
})

// ---------------------------------------------------------------------------
// 4. Contracts: the single source of truth for routes, types, validation,
//    OpenAPI, llms.txt and MCP tools.
// ---------------------------------------------------------------------------
const health = contract({
  method: 'GET',
  path: '/health',
  name: 'health_check',
  description: 'Liveness probe.',
  responses: { 200: t.Object({ status: t.String() }) },
})

const login = contract({
  method: 'POST',
  path: '/auth/login',
  description: 'Exchange demo credentials for a bearer token (valid 1 hour).',
  body: t.Object({ username: t.String(), password: t.String() }),
  responses: {
    200: t.Object({ token: t.String(), expiresIn: t.Number() }),
    401: t.Object({ error: t.String() }),
  },
})

const listTodos = contract({
  method: 'GET',
  path: '/todos',
  name: 'list_todos',
  description: 'List the caller’s todos, optionally filtered.',
  query: t.Object({
    status: t.Optional(t.Union([t.Literal('done'), t.Literal('open')])),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  }),
  responses: {
    200: t.Array(t.Object({ id: t.String(), title: t.String(), done: t.Boolean() })),
  },
})

const createTodo = contract({
  method: 'POST',
  path: '/todos',
  name: 'create_todo',
  description: 'Create a todo owned by the caller.',
  body: t.Object({ title: t.String({ minLength: 1, maxLength: 200 }) }),
  responses: { 201: t.Object({ id: t.String(), title: t.String(), done: t.Boolean() }) },
})

const getTodo = contract({
  method: 'GET',
  path: '/todos/:id',
  name: 'get_todo',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ id: t.String(), title: t.String(), done: t.Boolean() }),
    404: t.Object({ error: t.String() }),
  },
})

const updateTodo = contract({
  method: 'PATCH',
  path: '/todos/:id',
  name: 'update_todo',
  params: t.Object({ id: t.String() }),
  description: 'Toggle completion or retitle. Owners only.',
  body: t.Object({
    title: t.Optional(t.String({ minLength: 1 })),
    done: t.Optional(t.Boolean()),
  }),
  responses: {
    200: t.Object({ id: t.String(), title: t.String(), done: t.Boolean() }),
    403: t.Object({ error: t.String() }),
    404: t.Object({ error: t.String() }),
  },
})

const deleteTodo = contract({
  method: 'DELETE',
  path: '/todos/:id',
  name: 'delete_todo',
  params: t.Object({ id: t.String() }),
  responses: { 204: t.Null() },
})

// ---------------------------------------------------------------------------
// 5. Handlers: fully typed inputs, business logic only.
// ---------------------------------------------------------------------------
function requireUser(ctx: Ctx): string {
  return ctx.require(CurrentUser)
}

function ownTodo(ctx: Ctx, id: string): Todo {
  const todo = ctx.require(StoreKey).todos.get(id)
  if (!todo || todo.owner !== requireUser(ctx)) throw new HttpError(404, `no todo ${id}`, undefined)
  return todo
}

const app = createApp(
  [
    impl(health, async () => ({ status: 200 as const, body: { status: 'ok' } })),

    impl(login, async ({ body }) => {
      if (USERS.get(body.username) !== body.password) {
        throw new HttpError(401, 'Unknown credentials', undefined)
      }
      return {
        status: 200 as const,
        body: { token: sign({ sub: body.username, exp: Date.now() + 3_600_000 }), expiresIn: 3600 },
      }
    }),

    impl(listTodos, async ({ query, ctx }) => {
      const mine = [...ctx.require(StoreKey).todos.values()]
        .filter((td) => td.owner === requireUser(ctx))
        .filter((td) => (query?.status === 'done' ? td.done : query?.status === 'open' ? !td.done : true))
        .slice(0, query?.limit ?? 50)
      return { status: 200 as const, body: mine.map(({ id, title, done }) => ({ id, title, done })) }
    }),

    impl(createTodo, async ({ body, ctx }) => {
      const todo: Todo = { id: randomUUID(), owner: requireUser(ctx), title: body.title, done: false }
      ctx.require(StoreKey).todos.set(todo.id, todo)
      return {
        status: 201 as const,
        body: { id: todo.id, title: todo.title, done: todo.done },
      }
    }),

    impl(getTodo, async ({ params, ctx }) => {
      const { id, title, done } = ownTodo(ctx, params.id)
      return { status: 200 as const, body: { id, title, done } }
    }),

    impl(updateTodo, async ({ params, body, ctx }) => {
      const todo = ownTodo(ctx, params.id)
      if (body.title !== undefined) todo.title = body.title
      if (body.done !== undefined) todo.done = body.done
      return { status: 200 as const, body: { id: todo.id, title: todo.title, done: todo.done } }
    }),

    impl(deleteTodo, async ({ params, ctx }) => {
      ownTodo(ctx, params.id)
      ctx.require(StoreKey).todos.delete(params.id)
      return { status: 204 as const, body: null }
    }),
  ],
  {
    middleware: [logger, auth],
    provides: [
      provide(StoreKey, store),
      provide(SecretKey, { secret: SECRET }),
    ],
    mcp: true,
    llms: true,
    openapi: true,
    meta: { title: 'TODO API', description: 'Auth CRUD example for tzin.', version: '1.0.0' },
  },
)

// Node entry point when run directly (`npx tsx examples/todo-api.ts`).
const isDirectRun = process.argv[1]?.endsWith('todo-api.ts')
if (isDirectRun) {
  const { listen } = await import('../src/node.js')
  await listen(app, Number(process.env.PORT ?? 4644))
  console.log('TODO API on http://localhost:4644 — openapi at /openapi.json, MCP at /mcp')
}

export default app
