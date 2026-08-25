import { t } from '../../src/schema.js'
import { contract, impl, createApp } from '../../src/index.js'

const health = contract({
  method: 'GET',
  path: '/health',
  name: 'health_check',
  description: 'Liveness probe.',
  responses: { 200: t.Object({ ok: t.Boolean() }) },
})

const ping = contract({
  method: 'POST',
  path: '/ping',
  body: t.Object({ n: t.Number() }),
  responses: { 200: t.Object({ pong: t.Number() }) },
})

export default createApp([
  impl(health, async () => ({ status: 200 as const, body: { ok: true } })),
  impl(ping, async ({ body }) => ({ status: 200 as const, body: { pong: body.n + 1 } })),
])
