import { createServer, type Server } from 'node:http'
import type { App } from './server.js'

/**
 * Minimal Node adapter. Production version: streaming, WebSockets, graceful shutdown.
 *
 * Requests are duck-typed instead of constructed via `new Request()` — the
 * undici constructor costs ~13µs/request under load and is the single largest
 * adapter expense (measured with autocannon layer isolation). The object below
 * covers exactly the surface tzin dispatch uses: url, method, headers, signal,
 * json(), text(), arrayBuffer().
 */
export function listen(app: App, port = 3000): Promise<Server> {
  const server = createServer(async (nodeReq, nodeRes) => {
    nodeReq.socket.setNoDelay(true)
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

      // Abort the request signal when the connection dies mid-response,
      // so SSE producers stop feeding disconnected clients.
      const ac = new AbortController()
      nodeRes.on('close', () => {
        if (!nodeRes.writableEnded) ac.abort()
      })

      const req = {
        url: `http://${nodeReq.headers.host}${nodeReq.url}`,
        method: nodeReq.method,
        headers: new Headers(nodeReq.headers as Record<string, string>),
        signal: ac.signal,
        body: null,
        json: async () => {
          if (bodyBuf === undefined) throw new SyntaxError('Unexpected end of JSON input')
          return JSON.parse(bodyBuf.toString('utf8'))
        },
        text: async () => (bodyBuf ?? Buffer.alloc(0)).toString('utf8'),
        arrayBuffer: async () => (bodyBuf ?? Buffer.alloc(0)).buffer,
      } as unknown as Request

      const res = await app.fetch(req)
      const text = await res.text()
      const headers: Record<string, string | string[]> = {}
      res.headers.forEach((value, key) => {
        headers[key] = key === 'set-cookie' ? res.headers.getSetCookie() : value
      })
      nodeRes.writeHead(res.status, headers)
      nodeRes.end(text)
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
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server))
  })
}
