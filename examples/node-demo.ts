// Example: plain HTTP server for `npm run dev`.
// Run: npm run dev -- examples/node-demo.ts --port 4640
import { t } from '../src/schema.js'
import { contract, impl, HttpError, createApp } from '../src/index.js'

const health = contract({
  method: 'GET',
  path: '/health',
  responses: { 200: t.Object({ status: t.String() }) },
})

const getUser = contract({
  method: 'GET',
  path: '/users/:id',
  responses: {
    200: t.Object({ id: t.String(), name: t.String() }),
    404: t.Object({ error: t.String() }),
  },
})

const db = new Map([['1', { id: '1', name: 'Ada Lovelace' }]])

const app = createApp([
  impl(health, async () => ({ status: 200 as const, body: { status: 'ok' } })),
  impl(getUser, async ({ params }) => {
    const u = db.get(params.id)
    if (!u) throw new HttpError(404, `no user ${params.id}`)
    return { status: 200 as const, body: u }
  }),
])

export default app
