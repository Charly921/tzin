export interface ChannelEvent {
  topic: string
  event: string
  data: unknown
}

export type Subscriber = (e: ChannelEvent) => void

/**
 * In-process pub/sub hub. One process = one hub; multi-node deployments
 * swap this for a Redis/Postgres/Durable-Object-backed implementation.
 */
export class Hub {
  #topics = new Map<string, Set<Subscriber>>()

  subscribe(topic: string, fn: Subscriber): () => void {
    let set = this.#topics.get(topic)
    if (!set) {
      set = new Set()
      this.#topics.set(topic, set)
    }
    set.add(fn)
    return () => {
      set.delete(fn)
      if (set.size === 0) this.#topics.delete(topic)
    }
  }

  /** Deliver to current subscribers. Returns recipient count. */
  publish(topic: string, event: string, data: unknown): number {
    const set = this.#topics.get(topic)
    if (!set) return 0
    const e: ChannelEvent = { topic, event, data }
    for (const fn of [...set]) {
      try {
        fn(e)
      } catch {}
    }
    return set.size
  }

  subscriberCount(topic: string): number {
    return this.#topics.get(topic)?.size ?? 0
  }
}
