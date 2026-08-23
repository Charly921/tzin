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
  #map = new Map<ContextKey<never>, unknown>()

  get<T>(key: ContextKey<T>): T | undefined {
    return this.#map.get(key as ContextKey<never>) as T | undefined
  }

  /** Read a mandatory value; a missing one is a server bug -> 500. */
  require<T>(key: ContextKey<T>): T {
    const v = this.get(key)
    if (v === undefined) throw new HttpError(500, `Missing context '${key.name}'`)
    return v
  }

  set<T>(key: ContextKey<T>, value: T): void {
    this.#map.set(key as ContextKey<never>, value)
  }
}
