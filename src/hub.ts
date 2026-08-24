export interface ChannelEvent {
  topic: string
  event: string
  data: unknown
}

export type Subscriber = (e: ChannelEvent) => void

export interface BusLike {
  publish(channel: string, message: string): void
  subscribe(channel: string, handler: (message: string) => void): () => void
}

export interface HubOptions {
  /**
   * Wire this hub into a cluster: publishes fan out over the bus and remote
   * frames are delivered to local subscribers (own frames are ignored).
   * See src/bus.ts — Redis PUBLISH/SUBSCRIBE maps directly onto it.
   */
  bus?: BusLike
  channelPrefix?: string
}

interface ClusterFrame extends ChannelEvent {
  from: string
}

/**
 * In-process pub/sub hub — the local delivery point of a realtime node.
 * Standalone by default; pass `bus` to join a multi-node deployment.
 */
export class Hub {
  #topics = new Map<string, Set<Subscriber>>()
  #bus?: BusLike
  #prefix: string
  #id = Math.random().toString(36).slice(2)
  #busOffs = new Map<string, () => void>()
  #remoteListeners = new Set<Subscriber>()
  #infraChannel: string
  #infraOff?: () => void

  constructor(options: HubOptions = {}) {
    this.#bus = options.bus
    this.#prefix = options.channelPrefix ?? 'tzin:ch:'
    this.#infraChannel = `${this.#prefix}__infra__`
  }

  /**
   * Infrastructure hook: invoked for every frame arriving from OTHER nodes
   * over the dedicated infra channel, even when the topic has no local
   * subscribers (e.g. presence replication). Returns an unsubscribe function.
   */
  onRemote(fn: Subscriber): () => void {
    this.#remoteListeners.add(fn)
    if (this.#bus && !this.#infraOff) {
      this.#infraOff = this.#bus.subscribe(this.#infraChannel, (m) => this.#deliverInfra(m))
    }
    return () => {
      this.#remoteListeners.delete(fn)
      if (this.#remoteListeners.size === 0 && this.#infraOff) {
        this.#infraOff()
        this.#infraOff = undefined
      }
    }
  }

  /** Broadcast an infrastructure event to every other node's onRemote listeners. */
  emitRemote(e: ChannelEvent): void {
    if (!this.#bus || this.#remoteListeners.size === 0) return
    this.#bus.publish(
      this.#infraChannel,
      JSON.stringify({ topic: e.topic, event: e.event, data: e.data, from: this.#id }),
    )
  }

  #deliverInfra(message: string): void {
    let frame: ClusterFrame
    try {
      frame = JSON.parse(message) as ClusterFrame
    } catch {
      return
    }
    if (frame.from === this.#id) return // own echo
    const e: ChannelEvent = { topic: frame.topic, event: frame.event, data: frame.data }
    for (const fn of [...this.#remoteListeners]) {
      try {
        fn(e)
      } catch {}
    }
  }

  subscribe(topic: string, fn: Subscriber): () => void {
    let set = this.#topics.get(topic)
    if (!set) {
      set = new Set()
      this.#topics.set(topic, set)
    }
    set.add(fn)

    // First local subscriber on the topic pulls remote frames for it.
    const channel = this.#prefix + topic
    if (this.#bus && !this.#busOffs.has(channel)) {
      this.#busOffs.set(
        channel,
        this.#bus.subscribe(channel, (message) => this.#deliverRemote(topic, message)),
      )
    }

    return () => {
      set.delete(fn)
      if (set.size === 0) {
        this.#topics.delete(topic)
        // Last one out releases the bus subscription.
        this.#busOffs.get(channel)?.()
        this.#busOffs.delete(channel)
      }
    }
  }

  /** Deliver locally and, when clustered, broadcast to every other node. */
  publish(topic: string, event: string, data: unknown): number {
    if (this.#bus) {
      this.#bus.publish(
        this.#prefix + topic,
        JSON.stringify({ topic, event, data, from: this.#id } satisfies ClusterFrame),
      )
    }
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

  #deliverRemote(topic: string, message: string): void {
    let frame: ClusterFrame
    try {
      frame = JSON.parse(message) as ClusterFrame
    } catch {
      return
    }
    if (frame.from === this.#id) return // own echo
    const e: ChannelEvent = { topic: frame.topic, event: frame.event, data: frame.data }
    for (const fn of [...this.#remoteListeners]) {
      try {
        fn(e)
      } catch {}
    }
    const set = this.#topics.get(frame.topic)
    if (!set) return
    for (const fn of [...set]) {
      try {
        fn(e)
      } catch {}
    }
  }
}
