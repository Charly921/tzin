import type { ChannelEvent, Hub } from './hub.js'

export interface MemberInfo {
  member: string
  meta?: unknown
  onlineAt: number
  lastSeen: number
}

interface PresenceRecord extends MemberInfo {}

/**
 * Phoenix-style presence tracking over a Hub.
 * Members heartbeat to stay listed; a TTL sweep removes ghosts and
 * broadcasts `presence_diff`. Full `presence_state` is broadcast on joins.
 *
 * Cluster-aware: frames arriving from other nodes (via the hub's bus) are
 * merged silently into the local map, so every node holds the full view —
 * clients already receive the state/diff events through normal delivery.
 * Any node's sweep can therefore expire ghosts left behind by a dead node.
 */
export class Presence {
  #topics = new Map<string, Map<string, PresenceRecord>>()
  #sweeper: ReturnType<typeof setInterval> | undefined

  constructor(
    private readonly hub: Hub,
    private readonly ttlMs = 30_000,
  ) {
    hub.onRemote((e) => this.#applyRemote(e))
  }

  startSweeping(intervalMs = this.ttlMs): void {
    if (this.#sweeper) return
    this.#sweeper = setInterval(() => this.sweep(), intervalMs)
    ;(this.#sweeper as unknown as { unref?: () => void }).unref?.()
  }

  stopSweeping(): void {
    if (this.#sweeper) clearInterval(this.#sweeper)
    this.#sweeper = undefined
  }

  join(topic: string, member: string, meta?: unknown): void {
    const now = Date.now()
    const members = this.#members(topic)
    const existing = members.get(member)
    members.set(member, {
      member,
      ...(meta !== undefined ? { meta } : {}),
      onlineAt: existing?.onlineAt ?? now,
      lastSeen: now,
    })
    this.hub.publish(topic, 'presence_state', { members: this.snapshot(topic) })
    this.hub.emitRemote({ topic, event: 'presence_state', data: { members: this.snapshot(topic) } })
  }

  heartbeat(topic: string, member: string, meta?: unknown): void {
    this.join(topic, member, meta)
  }

  leave(topic: string, member: string): void {
    const members = this.#topics.get(topic)
    if (!members?.delete(member)) return
    if (members.size === 0) this.#topics.delete(topic)
    this.hub.publish(topic, 'presence_diff', { leaves: [member] })
    this.hub.emitRemote({ topic, event: 'presence_diff', data: { leaves: [member] } })
  }

  snapshot(topic: string): MemberInfo[] {
    return [...(this.#topics.get(topic)?.values() ?? [])].map((m) => ({ ...m }))
  }

  sweep(): void {
    const now = Date.now()
    for (const [topic, members] of [...this.#topics]) {
      const expired = [...members.values()].filter((m) => now - m.lastSeen > this.ttlMs)
      for (const m of expired) members.delete(m.member)
      if (expired.length) {
        if (members.size === 0) this.#topics.delete(topic)
        this.hub.publish(topic, 'presence_diff', { leaves: expired.map((m) => m.member) })
        this.hub.emitRemote({
          topic,
          event: 'presence_diff',
          data: { leaves: expired.map((m) => m.member) },
        })
      }
    }
  }

  #members(topic: string): Map<string, PresenceRecord> {
    let m = this.#topics.get(topic)
    if (!m) {
      m = new Map()
      this.#topics.set(topic, m)
    }
    return m
  }

  /**
   * Merge a frame from another node without re-publishing (no loops):
   * state frames add/refresh replicas; leaf diffs remove them. `lastSeen`
   * is stamped with the local clock so sweeps work despite node clock skew.
   */
  #applyRemote(e: ChannelEvent): void {
    if (e.event === 'presence_state') {
      const members = (e.data as { members?: MemberInfo[] }).members ?? []
      const map = this.#members(e.topic)
      const now = Date.now()
      for (const m of members) {
        const known = map.get(m.member)
        if (known) known.lastSeen = now
        else map.set(m.member, { ...m, lastSeen: now })
      }
    } else if (e.event === 'presence_diff') {
      const leaves = (e.data as { leaves?: string[] }).leaves ?? []
      const map = this.#topics.get(e.topic)
      if (!map) return
      for (const member of leaves) map.delete(member)
      if (map.size === 0) this.#topics.delete(e.topic)
    }
  }
}
