/**
 * Message bus abstraction for multi-node realtime.
 *
 * A bus moves serialized channel frames between nodes. The in-memory Hub
 * stays the local delivery point on every node; the bus is what makes two
 * processes behave like one deployment. Redis (PUBLISH/SUBSCRIBE), Postgres
 * LISTEN/NOTIFY and Cloudflare Durable Objects all map onto this interface.
 */
import { Hub } from './hub.js'

export interface MessageBus {
  /** Fire-and-forget broadcast to every node subscribed to the channel. */
  publish(channel: string, message: string): void
  /** Receive messages published on any node; returns an unsubscribe fn. */
  subscribe(channel: string, handler: (message: string) => void): () => void
}

/** In-process bus: wires hubs together inside one runtime (tests, single node). */
export class LocalBus implements MessageBus {
  #channels = new Map<string, Set<(message: string) => void>>()

  publish(channel: string, message: string): void {
    const set = this.#channels.get(channel)
    if (!set) return
    for (const handler of [...set]) handler(message)
  }

  subscribe(channel: string, handler: (message: string) => void): () => void {
    let set = this.#channels.get(channel)
    if (!set) {
      set = new Set()
      this.#channels.set(channel, set)
    }
    set.add(handler)
    return () => {
      set.delete(handler)
      if (set.size === 0) this.#channels.delete(channel)
    }
  }
}

/**
 * Create `count` Hubs that behave as one logical deployment over `bus`.
 * A publish on any hub reaches subscribers of every other hub, exactly as
 * it would across Redis pub/sub — only the transport differs.
 */
export function clusterHubs(bus: MessageBus, count = 2): Hub[] {
  const prefix = 'tzin:ch:'
  return Array.from({ length: count }, () => new Hub({ bus, channelPrefix: prefix }))
}
