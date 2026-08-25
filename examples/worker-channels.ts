/**
 * tzin on Cloudflare Workers: HTTP routes + native WebSocket channels.
 *
 * Runs the whole app inside a Durable Object (single I/O context) so
 * cross-connection broadcast works exactly like Node/Bun. Imports only
 * runtime-pure modules (no node:* builtins).
 *
 * wrangler config needs:
 *   "durable_objects": { "bindings": [{ "name": "TZIN_APP", "class_name": "TzinChannels" }] }
 *   "migrations": [{ "tag": "v1", "new_sqlite_classes": ["TzinChannels"] }]
 *
 * Try it: node scripts/workers-probe.mjs
 */
import { createApp } from '../src/server.js'
import { contract, impl } from '../src/contract.js'
import { t } from '../src/schema.js'
import { Hub } from '../src/hub.js'
import { Presence } from '../src/presence.js'
import { channelRoutes } from '../src/channels.js'
import { wsChannels } from '../src/ws.js'
import { toDurableWorker, toWorker, TzinChannels } from '../src/workers.js'

// workerd discovers Durable Object classes among the script's exports.
export { TzinChannels }

const health = contract({
  name: 'health',
  method: 'GET',
  path: '/health',
  responses: { 200: t.Object({ ok: t.Boolean(), runtime: t.String() }) },
})

export default toDurableWorker(() => {
  const hub = new Hub()
  const presence = new Presence(hub, 30_000)

  const app = createApp([
    impl(health, () => ({
      status: 200 as const,
      body: { ok: true, runtime: 'cloudflare-workers' },
    })),
    ...channelRoutes(hub, { presence }),
  ])
  return toWorker(app, { wsRoutes: [wsChannels(hub, { presence })] })
})
