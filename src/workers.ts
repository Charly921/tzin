/**
 * Cloudflare Workers adapter: a tzin app already speaks Web Standards,
 * so exporting it as an ExportedHandler is a one-liner.
 */
import type { App } from './server.js'

export function toWorker(app: App): {
  fetch: (req: Request) => Promise<Response> | Response
} {
  return {
    fetch: (req) => app.fetch(req),
  }
}
