import { t } from '@carlos-tzin/tzin'
import { contract, impl, createApp, listen } from '@carlos-tzin/tzin'

const health = contract({
  method: 'GET',
  path: '/health',
  responses: {
    200: t.Object({ status: t.String() }),
  },
})

const greet = contract({
  method: 'GET',
  path: '/greet/:name',
  params: t.Object({ name: t.String() }),
  responses: {
    200: t.Object({ message: t.String() }),
  },
})

const healthRoute = impl(health, async () => ({
  status: 200 as const,
  body: { status: 'ok' },
}))

const greetRoute = impl(greet, async ({ params }) => ({
  status: 200 as const,
  body: { message: `Hello, ${params.name}!` },
}))

const app = createApp([healthRoute, greetRoute], {
  openapi: true,
  llms: true,
  meta: { title: 'My tzin App', version: '0.0.0' },
})

listen(app, 3000)
console.log('Server running on http://localhost:3000')
