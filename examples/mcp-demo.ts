// Example: expose a tzin app as an MCP server over stdio.
// Run: npx tsx examples/mcp-demo.ts   (then speak newline-delimited JSON-RPC on stdin)
import { t } from '../src/schema.js'
import { contract, impl, HttpError, createApp } from '../src/index.js'
import { startStdioMcp } from '../src/mcp_stdio.js'

const getUser = contract({
  name: 'get_user',
  description: 'Look up a user by their numeric id',
  method: 'GET',
  path: '/users/:id',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ id: t.String(), name: t.String(), email: t.String() }),
    404: t.Object({ error: t.String() }),
  },
})

const searchUsers = contract({
  name: 'search_users',
  description: 'Search users by name prefix, limited results',
  method: 'GET',
  path: '/users',
  query: t.Object({ q: t.String(), limit: t.Optional(t.Number()) }),
  responses: {
    200: t.Array(t.Object({ id: t.String(), name: t.String() })),
  },
})

const db = new Map([
  ['1', { id: '1', name: 'Ada Lovelace', email: 'ada@calc.dev' }],
  ['2', { id: '2', name: 'Alan Turing', email: 'alan@bletchley.uk' }],
])

const app = createApp([
  impl(getUser, async ({ params }) => {
    const u = db.get(params.id)
    if (!u) throw new HttpError(404, `no user ${params.id}`)
    return { status: 200 as const, body: u }
  }),
  impl(searchUsers, async ({ query }) => ({
    status: 200 as const,
    body: [...db.values()]
      .filter((u) => u.name.toLowerCase().startsWith(query.q.toLowerCase()))
      .slice(0, query.limit ?? 10)
      .map(({ id, name }) => ({ id, name })),
  })),
])

startStdioMcp(app)
