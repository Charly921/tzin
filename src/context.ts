import { HttpError } from './contract.js'

declare const brand: unique symbol

/** Typed key for the request context bag. Create once per piece of data. */
export interface ContextKey<T> {
  readonly name: string
  readonly [brand]?: T
}

export function defineContext<T>(name: string): ContextKey<T> {
  return { name } as unknown as ContextKey<T>
}

/**
 * Per-request typed store. Middleware writes values; handlers read them.
 * Keys carry their value type, so get/require are fully inferred.
 */
export class Ctx {
  /** Allocated on first use — most requests never touch the bag. */
  #map?: Map<ContextKey<never>, unknown>
  #signal?: AbortSignal
  #getSignal?: () => AbortSignal | undefined

  /**
   * Accepts a ready signal or a factory. Adapters pass a factory so the
   * AbortController + close-listener wiring only happens when something
   * actually reads ctx.signal (SSE, channels) — not on the JSON hot path.
   */
  constructor(
    signal?: AbortSignal | (() => AbortSignal | undefined),
    seed?: ReadonlyMap<ContextKey<never>, unknown>,
  ) {
    if (typeof signal === 'function') this.#getSignal = signal
    else this.#signal = signal
    if (seed && seed.size > 0) {
      this.#map = new Map(seed as ReadonlyMap<ContextKey<never>, unknown>)
    }
  }

  get signal(): AbortSignal | undefined {
    if (this.#signal === undefined && this.#getSignal) {
      this.#signal = this.#getSignal()
      this.#getSignal = undefined
    }
    return this.#signal
  }

  get<T>(key: ContextKey<T>): T | undefined {
    return this.#map?.get(key as ContextKey<never>) as T | undefined
  }

  /** Read a mandatory value; a missing one is a server bug -> 500. */
  require<T>(key: ContextKey<T>): T {
    const v = this.get(key)
    if (v === undefined) throw new HttpError(500, `Missing context '${key.name}'`)
    return v
  }

  set<T>(key: ContextKey<T>, value: T): void {
    ;(this.#map ??= new Map()).set(key as ContextKey<never>, value)
  }
}
