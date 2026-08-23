import type { Ctx } from './context.js'

export interface Next {
  (): Promise<Response>
}

export interface MiddlewareInput {
  req: Request
  ctx: Ctx
  next: Next
}

export type Middleware = (input: MiddlewareInput) => Promise<Response>

export function middleware(fn: Middleware): Middleware {
  return fn
}

export type Dispatch = (req: Request, ctx: Ctx) => Promise<Response>

/**
 * Onion composition: first middleware = outermost layer.
 * Each middleware may run code before/after next(), short-circuit by not
 * calling it, or replace the response entirely. `tail` is the innermost layer.
 */
export function compose(mws: Middleware[], tail: Dispatch): Dispatch {
  return async (req, ctx) => {
    let index = -1
    const run = (i: number): Promise<Response> => {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      if (i === mws.length) return tail(req, ctx)
      return mws[i]({ req, ctx, next: () => run(i + 1) })
    }
    return run(0)
  }
}
