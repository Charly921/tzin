import { describe, expect, it, vi } from 'vitest'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'
import { PassThrough } from 'node:stream'
import { t } from '../src/schema.js'
import { listTools } from '../src/mcp.js'
import { contract, impl, createApp, listen, middleware, cors } from '../src/index.js'
import { startStdioMcpFromStreams } from '../src/mcp_stdio.js'
import type { App } from '../src/index.js'

const root = fileURLToPath(new URL('..', import.meta.url))

function makeRoutes() {
  const health = contract({
    method: 'GET',
    path: '/health',
    name: 'health_check',
    responses: { 200: t.Object({ ok: t.Boolean() }) },
  })
  const greet = contract({
    method: 'GET',
    path: '/greet/:name',
    params: t.Object({ name: t.String() }),
    name: 'greet_user',
    responses: { 200: t.Object({ msg: t.String() }) },
  })
  return [
    impl(health, async () => ({ status: 200, body: { ok: true } })),
    impl(greet, async ({ params }) => ({ status: 200, body: { msg: `hi ${params.name}` } })),
  ]
}

describe('stdio MCP framing (in-process streams)', () => {
  function wire(app: App) {
    const input = new PassThrough()
    const out = new PassThrough()
    startStdioMcpFromStreams(app, input, out)
    const buffer: string[] = []
    const waiters: ((line: string) => void)[] = []
    createInterface({ input: out }).on('line', (l) => {
      const w = waiters.shift()
      if (w) w(l)
      else buffer.push(l)
    })
    return {
      send: (obj: unknown) => input.write(JSON.stringify(obj) + '\n'),
      sendRaw: (s: string) => input.write(s + '\n'),
      next: () =>
        new Promise<string>((resolve) => {
          const l = buffer.shift()
          if (l !== undefined) resolve(l)
          else waiters.push(resolve)
        }),
      quiet: async (ms = 60) => {
        await new Promise((r) => setTimeout(r, ms))
        expect(buffer.length).toBe(0)
      },
    }
  }

  it('initialize answers with protocol version and server info', async () => {
    const io = wire(createApp(makeRoutes()))
    io.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })
    const res = JSON.parse(await io.next())
    expect(res.id).toBe(1)
    expect(res.result.protocolVersion).toBe('2025-06-18')
    expect(res.result.serverInfo.name).toBe('tzin')
  })

  it('tools/call resolves flat arguments and dispatches in-process', async () => {
    const io = wire(createApp(makeRoutes()))
    io.send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'greet_user', arguments: { name: 'ana' } } })
    const res = JSON.parse(await io.next())
    expect(JSON.parse(res.result.content[0].text)).toEqual({ msg: 'hi ana' })
  })

  it('malformed JSON line -> parse error with null id', async () => {
    const io = wire(createApp(makeRoutes()))
    io.sendRaw('{not json')
    const res = JSON.parse(await io.next())
    expect(res.id).toBeNull()
    expect(res.error.code).toBe(-32700)
  })

  it('notifications produce no output at all', async () => {
    const io = wire(createApp(makeRoutes()))
    io.send({ jsonrpc: '2.0', method: 'notifications/initialized' })
    io.sendRaw('') // blank lines ignored
    await io.quiet()
  })

  it('unknown methods yield -32601', async () => {
    const io = wire(createApp(makeRoutes()))
    io.send({ jsonrpc: '2.0', id: 9, method: 'resources/list' })
    const res = JSON.parse(await io.next())
    expect(res.error.code).toBe(-32601)
  })

  it('path params resolve even without a declared params section', async () => {
    // Regression: routes whose placeholders have no declared schema were
    // un-callable over MCP ("Missing argument(s): params.id").
    const bare = contract({
      method: 'GET',
      path: '/bare/:id',
      name: 'get_bare',
      responses: { 200: t.Object({ id: t.String() }) },
    })
    const app = createApp([
      impl(bare, async (input) => ({
        status: 200 as const,
        body: { id: (input as { params?: { id: string } }).params!.id },
      })),
    ])

    // the tool schema synthesizes the params section from the placeholders
    const tool = listTools(app.routes)[0] as { inputSchema: { properties: Record<string, any>; required: string[] } }
    expect(tool.inputSchema.properties.params.required).toEqual(['id'])

    const io = wire(app)
    io.send({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'get_bare', arguments: { id: 'x7' } } })
    const res = JSON.parse(await io.next())
    expect(JSON.parse(res.result.content[0].text)).toEqual({ id: 'x7' })
  })

  it('query coercion applies on MCP-dispatched calls too', async () => {
    const paged = contract({
      method: 'GET',
      path: '/items',
      query: t.Object({ loud: t.Optional(t.Boolean()) }),
      name: 'list_items',
      responses: { 200: t.Object({ loud: t.Boolean() }) },
    })
    const app = createApp([
      impl(paged, async ({ query }) => ({ status: 200 as const, body: { loud: query?.loud === true } })),
    ])
    const io = wire(app)
    io.send({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'list_items', arguments: { loud: true } } })
    const res = JSON.parse(await io.next())
    expect(JSON.parse(res.result.content[0].text)).toEqual({ loud: true })
  })
})

describe('stdio MCP end-to-end over a real process', () => {
  it('answers JSON-RPC on stdout for lines written to stdin', async () => {
    const child = spawn(process.execPath, ['--import', 'tsx', 'test/fixtures/stdio-app.ts'], {
      cwd: root,
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    const replies: any[] = []
    let notifySeen = false
    createInterface({ input: child.stdout! }).on('line', (l) => {
      const parsed = JSON.parse(l)
      if (parsed.id === undefined || parsed.id === null) notifySeen = true
      else replies[parsed.id] = parsed
    })

    child.stdin!.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }) + '\n')
    child.stdin!.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
    child.stdin!.write(
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'greet_user', arguments: { name: 'bo', loud: true } } }) + '\n',
    )
    // wait until the tools/call reply arrives, then stop the child
    const deadline = Date.now() + 15_000
    while ((!replies[1] || !replies[2]) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 50))
    }
    child.kill()

    expect(replies[1].result.serverInfo.name).toBe('tzin')
    // flat args resolved against the query section (loud:true -> uppercase)
    expect(JSON.parse(replies[2].result.content[0].text)).toEqual({ msg: 'HELLO BO' })
    expect(notifySeen).toBe(false)
  }, 20_000)
})

describe('dev server (spawned)', () => {
  it('prints the route table and serves the entry app', async () => {
    const port = 4755
    const child = spawn(process.execPath, ['--import', 'tsx', 'src/dev-server.ts', 'test/fixtures/dev-entry.ts', String(port)], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    let table = ''
    child.stdout!.on('data', (c: Buffer) => (table += c.toString()))

    try {
      // wait for the banner, then hit both routes
      const deadline = Date.now() + 15_000
      let up = false
      while (Date.now() < deadline && !up) {
        up = await fetch(`http://127.0.0.1:${port}/health`).then((r) => r.ok).catch(() => false)
        if (!up) await new Promise((r) => setTimeout(r, 100))
      }
      expect(up).toBe(true)

      const post = await fetch(`http://127.0.0.1:${port}/ping`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ n: 41 }),
      })
      expect(await post.json()).toEqual({ pong: 42 })

      expect(table).toContain('tzin dev · 2 routes')
      expect(table).toContain('/health')
      expect(table).toContain('health_check')
    } finally {
      child.kill()
    }
  }, 20_000)
})

describe('Node adapter error paths over the wire', () => {
  async function withServer(app: App, fn: (port: number) => Promise<void>) {
    const server = await listen(app, 0)
    try {
      await fn((server.address() as { port: number }).port)
    } finally {
      server.closeAllConnections?.()
      await new Promise((r) => server.close(r))
    }
  }

  // Regression: 204 with a serialized "null" body crashed undici (500).
  it.each([false, true])('204 No Content stays bodyless over the wire (middleware: %s)', async (useMiddleware) => {
    const remove = contract({
      method: 'DELETE',
      path: '/items/:id',
      params: t.Object({ id: t.String() }),
      responses: { 204: t.Null() },
    })
    const app = createApp(
      [impl(remove, async () => ({ status: 204 as const, body: null }))],
      useMiddleware ? { middleware: [middleware(async ({ next }) => next())] } : {},
    )
    await withServer(app, async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/items/abc`, { method: 'DELETE' })
      expect(res.status).toBe(204)
      expect(await res.text()).toBe('')
    })
  })

  it('handler crash -> clean 500 JSON, connection survives for keep-alive', async () => {
    const boom = contract({ method: 'GET', path: '/boom', responses: {} })
    const app = createApp([
      impl(boom, async () => {
        throw new Error('kaboom')
      }),
      ...makeRoutes(),
    ])
    await withServer(app, async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/boom`)
      expect(res.status).toBe(500)
      expect(await res.json()).toEqual({ error: 'Internal Server Error' })
      // same connection still serves subsequent requests
      const ok = await fetch(`http://127.0.0.1:${port}/health`)
      expect(ok.status).toBe(200)
    })
  })

  it('unknown path -> 404 JSON; wrong method -> 405 with Allow header', async () => {
    await withServer(createApp(makeRoutes()), async (port) => {
      const miss = await fetch(`http://127.0.0.1:${port}/nope`)
      expect(miss.status).toBe(404)
      expect(await miss.json()).toEqual({ error: 'Not Found' })

      const wrongMethod = await fetch(`http://127.0.0.1:${port}/health`, { method: 'DELETE' })
      expect(wrongMethod.status).toBe(405)
      expect(wrongMethod.headers.get('allow')).toBe('GET')
      expect((await wrongMethod.json()).error).toBe('Method Not Allowed')

      const prefix = await fetch(`http://127.0.0.1:${port}/health/deep`)
      expect(prefix.status).toBe(404)
    })
  })

  it('malformed JSON body -> 400 with details-free message', async () => {
    const echo = contract({
      method: 'POST',
      path: '/echo',
      body: t.Object({ n: t.Number() }),
      responses: { 200: t.Object({ n: t.Number() }) },
    })
    const app = createApp([impl(echo, async ({ body }) => ({ status: 200 as const, body: { n: body.n } }))])
    await withServer(app, async (port) => {
      const badJson = await fetch(`http://127.0.0.1:${port}/echo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{oops',
      })
      expect(badJson.status).toBe(400)

      const wrongShape = await fetch(`http://127.0.0.1:${port}/echo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ n: 'not-a-number' }),
      })
      expect(wrongShape.status).toBe(400)
      expect((await wrongShape.json()).error).toBe('Invalid body')
    })
  })
})

describe('cors middleware', () => {
  // Simple requests carry a browser-like Origin unless overridden.
  const get = (url: string, opts?: RequestInit) =>
    fetch(url, {
      ...opts,
      headers: { origin: 'https://example.com', ...((opts?.headers as Record<string, string>) ?? {}) },
    })

  it('preflight OPTIONS is answered by middleware (204 + ACAO) without hitting the router', async () => {
    const route = contract({ method: 'GET', path: '/data', responses: {} })
    const app = createApp([impl(route, async () => ({ status: 200 as const, body: {} } as never))], {
      middleware: [cors()],
    })
    const server = await listen(app, 0)
    try {
      const port = (server.address() as { port: number }).port
      const res = await fetch(`http://127.0.0.1:${port}/data`, {
        method: 'OPTIONS',
        headers: { origin: 'https://example.com', 'access-control-request-method': 'GET' },
      })
      expect(res.status).toBe(204)
      // default origin:'*' — the literal wildcard, not reflection
      expect(res.headers.get('access-control-allow-origin')).toBe('*')
      expect(res.headers.get('access-control-allow-methods')).toContain('GET')
      expect(res.headers.get('access-control-max-age')).toBe('86400')
      // router never matched (route is GET, OPTIONS unregistered) — middleware handled it
    } finally {
      server.closeAllConnections?.()
      await new Promise((r) => server.close(r))
    }
  })

  it('simple request gets ACAO + vary Origin in the response', async () => {
    const route = contract({ method: 'GET', path: '/ok', responses: { 200: t.Object({ ok: t.Boolean() }) } })
    const app = createApp([impl(route, async () => ({ status: 200 as const, body: { ok: true } }))], {
      middleware: [cors()],
    })
    const server = await listen(app, 0)
    try {
      const port = (server.address() as { port: number }).port
      const res = await get(`http://127.0.0.1:${port}/ok`)
      expect(res.status).toBe(200)
      // default origin:'*' — the literal wildcard, not reflection
      expect(res.headers.get('access-control-allow-origin')).toBe('*')
      expect(res.headers.get('vary')).toBe('Origin')
    } finally {
      server.closeAllConnections?.()
      await new Promise((r) => server.close(r))
    }
  })

  it('non-CORS request (no Origin) is untouched', async () => {
    const route = contract({ method: 'GET', path: '/x', responses: {} })
    const app = createApp([impl(route, async () => ({ status: 200 as const, body: {} } as never))], {
      middleware: [cors()],
    })
    const server = await listen(app, 0)
    try {
      const port = (server.address() as { port: number }).port
      const res = await fetch(`http://127.0.0.1:${port}/x`)
      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    } finally {
      server.closeAllConnections?.()
      await new Promise((r) => server.close(r))
    }
  })

  it('disallowed origin: no ACAO header (browser would block)', async () => {
    const route = contract({ method: 'GET', path: '/x', responses: {} })
    const app = createApp([impl(route, async () => ({ status: 200 as const, body: {} } as never))], {
      middleware: [cors({ origin: ['https://trusted.com'] })],
    })
    const server = await listen(app, 0)
    try {
      const port = (server.address() as { port: number }).port
      const res = await get(`http://127.0.0.1:${port}/x`)
      expect(res.status).toBe(200) // request still succeeds, browser blocks JS access
      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    } finally {
      server.closeAllConnections?.()
      await new Promise((r) => server.close(r))
    }
  })

  it('origin:true reflects any origin and credentials:true adds the credential header', async () => {
    const route = contract({ method: 'GET', path: '/x', responses: {} })
    const app = createApp([impl(route, async () => ({ status: 200 as const, body: {} } as never))], {
      middleware: [cors({ origin: true, credentials: true })],
    })
    const server = await listen(app, 0)
    try {
      const port = (server.address() as { port: number }).port
      const res = await get(`http://127.0.0.1:${port}/x`)
      expect(res.headers.get('access-control-allow-origin')).toBe('https://example.com')
      expect(res.headers.get('access-control-allow-credentials')).toBe('true')
    } finally {
      server.closeAllConnections?.()
      await new Promise((r) => server.close(r))
    }
  })

  it('credentials:true with wildcard origin:* does NOT echo ACAO (invalid per spec)', async () => {
    const route = contract({ method: 'GET', path: '/x', responses: {} })
    const app = createApp([impl(route, async () => ({ status: 200 as const, body: {} } as never))], {
      middleware: [cors({ credentials: true })], // defaults to origin:'*'
    })
    const server = await listen(app, 0)
    try {
      const port = (server.address() as { port: number }).port
      const res = await get(`http://127.0.0.1:${port}/x`)
      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    } finally {
      server.closeAllConnections?.()
      await new Promise((r) => server.close(r))
    }
  })

  it('preflight with allow-list: matching origin receives 204, non-matching does not', async () => {
    const route = contract({ method: 'GET', path: '/x', responses: {} })
    const app = createApp([impl(route, async () => ({ status: 200 as const, body: {} } as never))], {
      middleware: [cors({ origin: ['https://safe.com', 'https://other.com'] })],
    })
    const server = await listen(app, 0)
    try {
      const port = (server.address() as { port: number }).port
      const good = await fetch(`http://127.0.0.1:${port}/x`, {
        method: 'OPTIONS',
        headers: { origin: 'https://safe.com', 'access-control-request-method': 'GET' },
      })
      expect(good.status).toBe(204)
      expect(good.headers.get('access-control-allow-origin')).toBe('https://safe.com')

      const bad = await fetch(`http://127.0.0.1:${port}/x`, {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.com', 'access-control-request-method': 'GET' },
      })
      expect(bad.status).toBe(204) // browser blocks, no error from server
      expect(bad.headers.get('access-control-allow-origin')).toBeNull()
    } finally {
      server.closeAllConnections?.()
      await new Promise((r) => server.close(r))
    }
  })

  it('exposeHeaders: passes through to the browser as access-control-expose-headers', async () => {
    const route = contract({ method: 'GET', path: '/x', responses: {} })
    const app = createApp([impl(route, async () => ({ status: 200 as const, body: {} } as never))], {
      middleware: [cors({ exposeHeaders: ['X-Request-Id', 'X-Rate-Limit'] })],
    })
    const server = await listen(app, 0)
    try {
      const port = (server.address() as { port: number }).port
      const res = await get(`http://127.0.0.1:${port}/x`)
      expect(res.headers.get('access-control-expose-headers')).toBe('X-Request-Id, X-Rate-Limit')
    } finally {
      server.closeAllConnections?.()
      await new Promise((r) => server.close(r))
    }
  })

  it('preflight echoes access-control-request-headers from the browser', async () => {
    const route = contract({ method: 'GET', path: '/x', responses: {} })
    const app = createApp([impl(route, async () => ({ status: 200 as const, body: {} } as never))], {
      middleware: [cors({ allowHeaders: ['Authorization', 'Content-Type'] })],
    })
    const server = await listen(app, 0)
    try {
      const port = (server.address() as { port: number }).port
      const res = await fetch(`http://127.0.0.1:${port}/x`, {
        method: 'OPTIONS',
        headers: {
          origin: 'https://example.com',
          'access-control-request-method': 'GET',
          'access-control-request-headers': 'X-Custom',
        },
      })
      expect(res.headers.get('access-control-allow-headers')).toBe('X-Custom')
    } finally {
      server.closeAllConnections?.()
      await new Promise((r) => server.close(r))
    }
  })
})
