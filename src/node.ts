import { createServer, type Server } from 'node:http'
import type { App } from './server.js'

/** Minimal Node adapter. Production version: streaming, WebSockets, graceful shutdown. */
export function listen(app: App, port = 3000): Promise<Server> {
  const server = createServer(async (nodeReq, nodeRes) => {
    try {
      const chunks: Buffer[] = []
      for await (const chunk of nodeReq) chunks.push(chunk as Buffer)
      const body = nodeReq.headers['content-length'] ? Buffer.concat(chunks) : undefined

      const req = new Request(`http://${nodeReq.headers.host}${nodeReq.url}`, {
        method: nodeReq.method,
        headers: nodeReq.headers as Record<string, string>,
        body,
      })

      const res = await app.fetch(req)
      nodeRes.statusCode = res.status
      res.headers.forEach((value, key) => nodeRes.setHeader(key, value))
      nodeRes.end(Buffer.from(await res.arrayBuffer()))
    } catch (err) {
      nodeRes.statusCode = 500
      nodeRes.end('Internal Server Error')
      console.error(err)
    }
  })
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server))
  })
}
