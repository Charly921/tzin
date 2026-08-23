import type { Static, TSchema } from './schema.js'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

/**
 * A Contract is the single source of truth for an endpoint.
 * Plain object literal -> shallow types -> no deep instantiation.
 */
export interface ContractDef {
  method: HttpMethod
  path: string
  params?: TSchema
  query?: TSchema
  body?: TSchema
  responses: Record<number, TSchema>
}

/** Identity function with `const` generics: preserves literal method/path/status keys. */
export function contract<const C extends ContractDef>(def: C): C {
  return def
}

export type AnyContract = ContractDef

/* ------------------------------------------------------------------ */
/* Type-level derivation (all shallow: indexed access, no recursion   */
/* over route chains -> constant cost per endpoint)                   */
/* ------------------------------------------------------------------ */

type StaticOf<S> = S extends TSchema ? Static<S> : never

/** '/users/:id/posts/:postId' -> 'id' | 'postId' */
export type PathParamNames<P extends string> =
  P extends `${string}:${infer Name}/${infer Rest}`
    ? Name | PathParamNames<Rest>
    : P extends `${string}:${infer Name}`
      ? Name
      : never

/**
 * Extractor-style handler input: only the sections the contract declares.
 * Destructure what you need, Axum-style guards become typed properties.
 */
export type HandlerInput<C extends AnyContract> = {} & ('params' extends keyof C
  ? { params: StaticOf<C['params']> }
  : {}) &
  ('query' extends keyof C ? { query: StaticOf<C['query']> } : {}) &
  ('body' extends keyof C ? { body: StaticOf<C['body']> } : {})

/** Discriminated union of every declared success response. */
export type ResponseOf<C extends AnyContract> = {
  [K in keyof C['responses']]: {
    status: K extends number ? K : K extends `${infer N extends number}` ? N : never
    body: StaticOf<C['responses'][K]>
  }
}[keyof C['responses']]

export type Handler<C extends AnyContract> = (
  input: HandlerInput<C>,
) => ResponseOf<C> | Promise<ResponseOf<C>>

export interface RouteImpl<C extends AnyContract = AnyContract> {
  contract: C
  handler: Handler<C>
}

/** Bind an implementation to a contract. The compiler checks inputs AND outputs. */
export function impl<const C extends AnyContract>(c: C, handler: Handler<C>): RouteImpl<C> {
  return { contract: c, handler }
}

/** Thrown inside handlers -> converted to an HTTP error response. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}
