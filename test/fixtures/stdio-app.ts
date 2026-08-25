import { t } from '../../src/schema.js'
import { contract, impl, createApp } from '../../src/index.js'
import { startStdioMcpFromStreams } from '../../src/mcp_stdio.js'

const health = contract({
  method: 'GET',
  path: '/health',
  name: 'health_check',
  description: 'Liveness probe.',
  responses: { 200: t.Object({ ok: t.Boolean() }) },
})

const greet = contract({
  method: 'GET',
  path: '/greet/:name',
  params: t.Object({ name: t.String() }),
  query: t.Object({ loud: t.Optional(t.Boolean()) }),
  name: 'greet_user',
  responses: { 200: t.Object({ msg: t.String() }) },
})

const app = createApp([
  impl(health, async () => ({ status: 200 as const, body: { ok: true } })),
  impl(greet, async ({ params, query }) => ({
    status: 200 as const,
    body: { msg: query?.loud ? `HELLO ${params.name.toUpperCase()}` : `hi ${params.name}` },
  })),
])

startStdioMcpFromStreams(app, process.stdin, process.stdout)
