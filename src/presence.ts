import type { Hub } from './hub.js'

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
 */
export class Presence {
  #topics = new Map<string, Map<string, PresenceRecord>>()
  #sweeper: ReturnType<typeof setInterval> | undefined

  constructor(
    private readonly hub: Hub,
    private readonly ttlMs = 30_000,
  ) {}

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
  }

  heartbeat(topic: string, member: string, meta?: unknown): void {
    this.join(topic, member, meta)
  }

  leave(topic: string, member: string): void {
    const members = this.#topics.get(topic)
    if (!members?.delete(member)) return
    if (members.size === 0) this.#topics.delete(topic)
    this.hub.publish(topic, 'presence_diff', { leaves: [member] })
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
}
