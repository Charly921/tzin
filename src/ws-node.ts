/**
 * Node WebSocket adapter: attaches WsRoutes to an http.Server via the `ws`
 * package. Route matching reuses the same radix trie as HTTP dispatch.
 */
import { WebSocketServer } from 'ws'
import type { Server } from 'node:http'
import { createMatcher } from './router.js'
import type { WsRoute, WsSend } from './ws.js'

export function attachChannels(httpServer: Server, routes: WsRoute[]): void {
  const wss = new WebSocketServer({ noServer: true })
  const matcher = createMatcher(routes.map((r) => ({ method: 'GET', path: r.path, route: r })))

  httpServer.on('upgrade', (req, socket, head) => {
    let url: URL
    try {
      url = new URL(req.url ?? '/', 'http://local')
    } catch {
      socket.destroy()
      return
    }
    const hit = matcher('GET', url.pathname)
    if (!hit || !('route' in hit)) {
      socket.destroy()
      return
    }
    const route = hit.route as WsRoute

    wss.handleUpgrade(req, socket, head, (ws) => {
      const send: WsSend = (frame) => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(frame))
      }
      const state = route.open(send, url)
      ws.on('message', (data) => route.message(state, data.toString()))
      ws.on('close', () => route.close(state))
      ws.on('error', () => ws.close())
    })
  })
}
