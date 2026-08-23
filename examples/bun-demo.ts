// Example: serve a tzin app with Bun.
// Run: bun examples/bun-demo.ts
import { t } from '../src/schema.js'
import { contract, impl, createApp, serveBun } from '../src/index.js'

const health = contract({
  method: 'GET',
  path: '/health',
  responses: { 200: t.Object({ status: t.String(), runtime: t.String() }) },
})

const echo = contract({
  method: 'POST',
  path: '/echo',
  body: t.Object({ message: t.String(), loud: t.Optional(t.Boolean()) }),
  responses: {
    200: t.Object({ echoed: t.String() }),
    400: t.Object({ error: t.String() }),
  },
})

const app = createApp([
  impl(health, async () => ({ status: 200 as const, body: { status: 'ok', runtime: `bun ${Bun.version}` } })),
  impl(echo, async ({ body }) => ({
    status: 200 as const,
    body: { echoed: body.loud ? body.message.toUpperCase() : body.message },
  })),
])

serveBun(app, 4620)
console.log('tzin on bun → http://localhost:4620')
