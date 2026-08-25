import { createServer, type Server } from 'node:http'
import type { App, RawReply } from './server.js'

/**
 * Minimal Node adapter. Production version: streaming, WebSockets, graceful shutdown.
 *
 * Hot-path notes (measured with autocannon layer isolation):
 * - Requests are duck-typed instead of constructed via `new Request()` — the
 *   undici constructor costs ~13µs/request under load.
 * - Replies come from app.dispatchRaw(): tzin-built responses never allocate
 *   an undici Response (~19µs/request under load). raw()/SSE still arrive as
 *   a Response and take the streaming branch below.
 * - `headers` on the duck request is a lazy getter: undici Headers allocation
 *   is wasted work for contracts without a headers/cookies section.
 * - The abort signal is lazy too: AbortController + close listener are only
 *   wired when ctx.signal is actually read (SSE, channels), never on the
 *   JSON hot path.
 */
export function listen(app: App, port = 3000): Promise<Server> {
  const dispatch = app.dispatchRaw?.bind(app) ?? defaultDispatch(app)
  const server = createServer(async (nodeReq, nodeRes) => {
    try {
      // Only drain the request stream when a body can actually be present.
      let bodyBuf: Buffer | undefined
      if (
        Number(nodeReq.headers['content-length'] ?? 0) > 0 ||
        nodeReq.headers['transfer-encoding'] !== undefined
      ) {
        const chunks: Buffer[] = []
        for await (const chunk of nodeReq) chunks.push(chunk as Buffer)
        bodyBuf = Buffer.concat(chunks)
      }

      // Signal wiring is deferred: the AbortController + close-listener only
      // materialize if something reads ctx.signal (SSE, channels). JSON
      // requests never pay for it.
      let cachedSignal: AbortSignal | undefined
      const signalFactory = () => {
        if (cachedSignal === undefined) {
          const ac = new AbortController()
          nodeRes.on('close', () => {
            if (!nodeRes.writableEnded) ac.abort()
          })
          cachedSignal = ac.signal
        }
        return cachedSignal
      }

      let headers: Headers | undefined
      const req = {
        url: `http://${nodeReq.headers.host}${nodeReq.url}`,
        method: nodeReq.method,
        get headers() {
          return (headers ??= new Headers(nodeReq.headers as Record<string, string>))
        },
        get signal() {
          return signalFactory()
        },
        __tzin_signal_factory: signalFactory,
        body: null,
        json: async () => {
          if (bodyBuf === undefined) throw new SyntaxError('Unexpected end of JSON input')
          return JSON.parse(bodyBuf.toString('utf8'))
        },
        text: async () => (bodyBuf ?? Buffer.alloc(0)).toString('utf8'),
        arrayBuffer: async () => (bodyBuf ?? Buffer.alloc(0)).buffer,
      } as unknown as Request

      const reply = await dispatch(req)

      if (reply.response) {
        const res = reply.response
        nodeRes.writeHead(res.status, resHeadersSlow(res))
        // Streaming response (SSE, raw()): pump with backpressure instead of
        // buffering — text()/arrayBuffer() would wait for the stream to close,
        // which for event streams is never.
        if (!res.body) {
          nodeRes.end()
          return
        }
        const reader = res.body.getReader()
        try {
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            if (!nodeRes.write(value)) {
              await new Promise<void>((resolve) => nodeRes.once('drain', resolve))
            }
          }
          nodeRes.end()
        } catch {
          nodeRes.destroy()
        }
        return
      }

      nodeRes.writeHead(reply.status, reply.headers)
      nodeRes.end(reply.text)
    } catch (err) {
      if (!nodeRes.headersSent) {
        nodeRes.statusCode = 500
        nodeRes.end('Internal Server Error')
      } else {
        nodeRes.end()
      }
      console.error(err)
    }
  })
  // Nagle off once per socket, not per request.
  server.on('connection', (socket) => socket.setNoDelay(true))
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server))
  })
}

function resHeadersSlow(res: Response): Record<string, string | string[]> {
  const headers: Record<string, string | string[]> = {}
  res.headers.forEach((value, key) => {
    headers[key] = key === 'set-cookie' ? res.headers.getSetCookie() : value
  })
  return headers
}

/** Fallback for App implementations without dispatchRaw (e.g. wrappers). */
function defaultDispatch(app: App): (req: Request) => Promise<RawReply> {
  return async (req) => {
    const res = await app.fetch(req)
    return { status: res.status, response: res }
  }
}
