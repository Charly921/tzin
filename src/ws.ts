/**
 * Runtime-neutral WebSocket routing: one protocol implementation, thin
 * adapters per platform (src/ws-node.ts with the `ws` package, src/bun.ts
 * with Bun's native websockets).
 *
 * Channel protocol over WS (mirrors channelRoutes' SSE+POST semantics):
 *   server -> client: { event, data }            broadcasts + presence_state/presence_diff
 *   client -> server: { type: 'push', event, data?, id? }
 *                     { type: 'heartbeat', meta? }
 */
import type { Hub } from './hub.js'
import type { Presence } from './presence.js'

export type WsSend = (frame: unknown) => void

export interface WsRoute {
  /** Path pattern with :params, same syntax as HTTP contracts. */
  readonly path: string
  /** Connection established; return per-connection state. */
  open(send: WsSend, url: URL): unknown
  /** A text frame arrived. */
  message(state: unknown, text: string): void
  /** Connection closed (client disconnect or server shutdown). */
  close(state: unknown): void
}

export interface WsChannelOptions {
  presence?: Presence
}

interface ChannelState {
  topic: string
  member?: string
  unsub: () => void
  __send: WsSend
}

export function wsChannels(hub: Hub, options: WsChannelOptions = {}): WsRoute {
  const presence = options.presence

  return {
    path: '/channels/:topic',

    open(send, url) {
      const topic = decodeURIComponent(url.pathname.split('/')[2] ?? '')
      const member = url.searchParams.get('member') ?? undefined
      const unsub = hub.subscribe(topic, (e) => send({ event: e.event, data: e.data }))
      if (member && presence) presence.join(topic, member)
      // Initial full view on connect (parity with the SSE channel routes).
      if (presence) send({ event: 'presence_state', data: { members: presence.snapshot(topic) } })
      return { topic, member, unsub, __send: send } satisfies ChannelState
    },

    message(state, text) {
      const s = state as ChannelState
      let frame: { type?: string; event?: string; data?: unknown; meta?: unknown }
      try {
        frame = JSON.parse(text)
      } catch {
        s.__send({ error: 'invalid JSON frame' })
        return
      }
      switch (frame.type) {
        case 'push':
          if (!frame.event) {
            s.__send({ error: 'push requires event' })
            return
          }
          hub.publish(s.topic, frame.event, frame.data ?? null)
          break
        case 'heartbeat':
          if (s.member && presence) presence.heartbeat(s.topic, s.member, frame.meta)
          break
        default:
          s.__send({ error: `unknown frame type: ${String(frame.type)}` })
      }
    },

    close(state) {
      const s = state as ChannelState
      s.unsub()
      if (s.member && presence) presence.leave(s.topic, s.member)
    },
  }
}
