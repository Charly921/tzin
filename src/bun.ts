/**
 * Bun adapter. NOTE: authored against Bun's documented `Bun.serve` API;
 * this repo's CI has no Bun runtime yet, so it is untested here.
 */
import type { App } from './server.js'

declare const Bun: {
  serve(options: {
    port?: number
    fetch: (req: Request) => Promise<Response> | Response
  }): unknown
}

export function serve(app: App, port = 3000): void {
  Bun.serve({
    port,
    fetch: (req) => app.fetch(req),
  })
}
