import type { ContextKey } from './context.js'

/**
 * App-scoped dependency registration. A provided value is seeded into every
 * request's Ctx, so handlers and middleware read it with ctx.require(key)
 * and get the same instance each time (singleton lifetime).
 *
 * Request-scoped values (set by middleware at runtime) may overwrite seeds.
 */
export interface ProvidedEntry {
  readonly key: ContextKey<never>
  readonly value: unknown
}

export function provide<K extends ContextKey<unknown>>(
  key: K,
  value: K extends ContextKey<infer V> ? V : never,
): ProvidedEntry {
  return { key: key as unknown as ContextKey<never>, value }
}
