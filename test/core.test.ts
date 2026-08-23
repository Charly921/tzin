import { describe, expect, expectTypeOf, it } from 'vitest'
import { t } from '../src/schema.js'
import { contract, impl, HttpError, createApp, generateOpenApi, listen, client, middleware, defineContext } from '../src/index.js'
import type { Ctx } from '../src/index.js'
import type { ResponseOf, HandlerInput, PathParamNames } from '../src/contract.js'

/* ---------------- domain contracts ---------------- */

const NotFound = t.Object({ error: t.String() })
const ValidationError = t.Object({ error: t.String(), details: t.Optional(t.Array(t.String())) })

const getUser = contract({
  method: 'GET',
  path: '/users/:id',
  params: t.Object({ id: t.String({ minLength: 1 }) }),
  responses: {
    200: t.Object({ id: t.String(), name: t.String(), tags: t.Array(t.String()) }),
    404: NotFound,
  },
})

const listUsers = contract({
  method: 'GET',
  path: '/users',
  query: t.Object({ limit: t.Optional(t.String()), q: t.Optional(t.String()) }),
  responses: {
    200: t.Array(t.Object({ id: t.String() })),
  },
})

const createUser = contract({
  method: 'POST',
  path: '/users',
  body: t.Object({ name: t.String({ minLength: 2 }), email: t.String({ format: 'email' }) }),
  responses: {
    201: t.Object({ id: t.String(), name: t.String() }),
    422: ValidationError,
  },
})

const health = contract({
  method: 'GET',
  path: '/health',
  responses: { 200: t.Literal('ok') },
})

const healthRoute = impl(health, async () => ({ status: 200 as const, body: 'ok' as const }))

const db = new Map<string, { id: string; name: string; email?: string; tags?: string[] }>()
db.set('u1', { id: 'u1', name: 'Ada', tags: ['admin'] })

const routes = [
  healthRoute,
  impl(getUser, async ({ params }) => {
    // extractor-style input is fully typed:
    expectTypeOf(params).toEqualTypeOf<{ id: string }>()
    const user = db.get(params.id)
    if (!user) throw new HttpError(404, 'User not found')
    return {
      status: 200,
      body: { id: user.id, name: user.name, tags: user.tags ?? [] },
    }
  }),
  impl(listUsers, async ({ query }) => {
    expectTypeOf(query).toEqualTypeOf<{ limit?: string; q?: string }>()
    let all = [...db.values()].map((u) => ({ id: u.id }))
    if (query?.q) all = all.filter((u) => u.id.includes(query.q!))
    if (query?.limit) all = all.slice(0, Number(query.limit))
    return { status: 200, body: all }
  }),
  impl(createUser, async ({ body }) => {
    expectTypeOf(body).toEqualTypeOf<{ name: string; email: string }>()
    if (body.email.endsWith('@blocked.com')) throw new HttpError(422, 'Email blocked')
    const id = `u${db.size + 1}`
    db.set(id, { id, ...body })
    return { status: 201, body: { id, name: body.name } }
  }),
]

const app = createApp(routes)
const jsonReq = (path: string, init?: RequestInit) =>
  app.fetch(new Request(`http://test${path}`, init))

/* ---------------- runtime behaviour ---------------- */

describe('routing & extractors', () => {
  it('GET with path params -> 200', async () => {
    const res = await jsonReq('/users/u1')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 'u1', name: 'Ada', tags: ['admin'] })
  })

  it('query params flow through', async () => {
    const res = await jsonReq('/users?limit=1&q=u1')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'u1' }])
  })

  it('POST validates and creates', async () => {
    const res = await jsonReq('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Grace', email: 'grace@dev.io' }),
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ name: 'Grace' })
  })

  it('rejects invalid body with 400 + details', async () => {
    const res = await jsonReq('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'nope' }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid body')
    expect(Array.isArray(data.details)).toBe(true)
  })

  it('HttpError maps to declared status', async () => {
    const res = await jsonReq('/users/nope')
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: 'User not found' })
  })

  it('unknown route -> 404', async () => {
    const res = await jsonReq('/missing')
    expect(res.status).toBe(404)
  })

  it('malformed JSON -> 400', async () => {
    const res = await jsonReq('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{oops',
    })
    expect(res.status).toBe(400)
  })
})

describe('openapi generation', () => {
  it('emits OpenAPI 3.1 from contracts', () => {
    const doc = generateOpenApi(routes, { title: 'Demo', version: '0.0.0' }) as any
    expect(doc.openapi).toBe('3.1.0')
    expect(doc.paths['/users/{id}'].get.responses['200'].content['application/json'].schema).toBeTruthy()
    expect(doc.paths['/users'].post.requestBody).toBeTruthy()
    expect(doc.paths['/users/{id}'].get.parameters[0].name).toBe('id')
  })
})

describe('typed client end-to-end', () => {
  it('calls the running server with full inference', async () => {
    const server = await listen(app, 0)
    const addr = server.address()
    const port = typeof addr === 'object' && addr ? addr.port : 3000
    try {
      const api = client(
        { getUser, listUsers, createUser, health },
        `http://127.0.0.1:${port}`,
      )

      const ok = await api.getUser({ params: { id: 'u1' } })
      const okData = ok.data
      if ('error' in okData) {
        expectTypeOf(okData.error).toEqualTypeOf<string>()
      } else {
        expectTypeOf(okData).toEqualTypeOf<{ id: string; name: string; tags: string[] }>()
      }
      expect(ok.status).toBe(200)

      const created = await api.createUser({ body: { name: 'Linus', email: 'l@kernel.org' } })
      expect(created.status).toBe(201)

      const bad = await api.createUser({ body: { name: 'x', email: 'bad' } })
      expect(bad.status).toBe(400)

      const list = await api.listUsers({ query: { limit: '1' } })
      expect(list.status).toBe(200)
      expect(list.data).toHaveLength(1)
    } finally {
      server.closeAllConnections?.()
      server.close()
    }
  })
})

/* ---------------- type-level guarantees ---------------- */

describe('contract types', () => {
  it('parses path param names', () => {
    expectTypeOf<PathParamNames<'/users/:id/posts/:postId'>>().toEqualTypeOf<'id' | 'postId'>()
  })

  it('derives response union from declared statuses', () => {
    expectTypeOf<ResponseOf<typeof getUser>>().toEqualTypeOf<
      { status: 200; body: { id: string; name: string; tags: string[] } } | { status: 404; body: { error: string } }
    >()
  })

  it('input only exposes what the contract declares', () => {
    expectTypeOf<HandlerInput<typeof health>>().toEqualTypeOf<{ ctx: Ctx }>()
    expectTypeOf<HandlerInput<typeof getUser>['params']>().toEqualTypeOf<{ id: string }>()
  })
})

describe('middleware', () => {
  const user = defineContext<{ userId: string }>('user')

  const auth = middleware(async ({ req, ctx, next }) => {
    const token = req.headers.get('authorization')
    if (!token) throw new HttpError(401, 'unauthorized')
    ctx.set(user, { userId: `u-${token}` })
    return next()
  })

  const tracer = middleware(async ({ next }) => {
    const res = await next()
    return new Response(res.body, { status: res.status, headers: { 'x-traced': 'yes' } })
  })

  const whoami = contract({
    method: 'GET',
    path: '/whoami',
    responses: {
      200: t.Object({ userId: t.String() }),
      401: t.Object({ error: t.String() }),
    },
  })

  it('runs onion-style in registration order', async () => {
    const order: string[] = []
    const a = middleware(async ({ next }) => {
      order.push('a-pre')
      const res = await next()
      order.push('a-post')
      return res
    })
    const b = middleware(async ({ next }) => {
      order.push('b-pre')
      const res = await next()
      order.push('b-post')
      return res
    })

    const app = createApp([healthRoute], { middleware: [a, b] })
    await app.fetch(new Request('http://x/health'))

    expect(order).toEqual(['a-pre', 'b-pre', 'b-post', 'a-post'])
  })

  it('short-circuits before the handler when auth fails', async () => {
    let handlerRan = false
    const route = impl(whoami, async ({ ctx }) => {
      handlerRan = true
      return { status: 200, body: ctx.require(user) }
    })

    const app = createApp([route], { middleware: [auth] })
    const res = await app.fetch(new Request('http://x/whoami'))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized', details: undefined })
    expect(handlerRan).toBe(false)
  })

  it('shares typed context from middleware to handler', async () => {
    const route = impl(whoami, async ({ ctx }) => ({
      status: 200,
      body: { userId: ctx.require(user).userId },
    }))

    const app = createApp([route], { middleware: [tracer, auth] })
    const res = await app.fetch(
      new Request('http://x/whoami', { headers: { authorization: 'secret' } }),
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ userId: 'u-secret' })
    expect(res.headers.get('x-traced')).toBe('yes')
  })

  it('require() on missing context is a 500', async () => {
    const noAuth = impl(whoami, async ({ ctx }) => ({ status: 200, body: ctx.require(user) }))
    const app = createApp([noAuth])
    const res = await app.fetch(new Request('http://x/whoami'))

    expect(res.status).toBe(500)
  })

  it('rejects double next()', async () => {
    const double = middleware(async ({ next }) => {
      await next()
      return next()
    })
    const app = createApp([healthRoute], { middleware: [double] })
    const res = await app.fetch(new Request('http://x/health'))

    expect(res.status).toBe(500)
  })
})
