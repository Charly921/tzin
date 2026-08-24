// Generates scale fixtures: our contract model vs an equivalent chained Hono app.
import { mkdirSync, writeFileSync } from 'node:fs'

const N = Number(process.argv[2] ?? 100)
mkdirSync('bench/src', { recursive: true })

const resources = Array.from({ length: Math.ceil(N / 5) }, (_, k) => `res${k}`)
const httpMethods = ['GET', 'GET', 'POST', 'PUT', 'DELETE']
const kinds = ['list', 'get', 'create', 'update', 'remove']

function fields(i) {
  return [
    `id: t.String()`,
    `name: t.String()`,
    `field${i}: t.Optional(t.Number())`,
    `tags: t.Array(t.String())`,
    `meta: t.Object({ k: t.String(), v: t.Number() })`,
  ].join(', ')
}

/* ------------------------- OURS ------------------------- */

let head = `// AUTO-GENERATED scale fixture (${N} endpoints) - our contract model
import { t } from '../../src/schema.js'
import { contract, impl } from '../../src/contract.js'
import { client } from '../../src/client.js'
`

let contracts = ''
let impls = ''
const names = []
for (let i = 0; i < N; i++) {
  const name = `${kinds[i % 5]}_${resources[Math.floor(i / 5)]}_${i}`
  const hasId = i % 5 !== 0 && i % 5 !== 2
  const hasBody = i % 5 === 2 || i % 5 === 3
  const path = hasId ? `/${resources[Math.floor(i / 5)]}/:id` : `/${resources[Math.floor(i / 5)]}`

  contracts += `
export const ${name} = contract({
  method: '${httpMethods[i % 5]}',
  path: '${path}',
${hasId ? `  params: t.Object({ id: t.String() }),\n` : ''}${hasBody ? `  body: t.Object({ ${fields(i)} }),\n` : ''}  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ ${fields(i)} }), at: t.String() }),
  },
})
`
  impls += `export const r_${name} = impl(${name}, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
`
  names.push(name)
}

const registry = `
export const endpoints = {
${names.map((n) => `  ${n}: r_${n},`).join('\n')}
}

type Contracts = { [K in keyof typeof endpoints]: (typeof endpoints)[K]['contract'] }
export type ApiClient = ReturnType<typeof client<Contracts>>
export function makeApi(base: string): ApiClient {
  return client(Object.fromEntries(Object.entries(endpoints).map(([k, v]) => [k, v.contract])) as Contracts, base)
}

// forces instantiation of every endpoint's call signature through the mapped type
export type AllSignatures = { [K in keyof ApiClient]: Parameters<ApiClient[K]> }

export async function demo(api: ApiClient) {
  const r = await api.get_${resources[0]}_1({ params: { id: 'abc' } })
  return r.status === 200 ? r.body.item.name : null
}
`

writeFileSync(
  'bench/src/ours.fixture.ts',
  head + contracts + impls + registry,
)

/* ------------------------- HONO ------------------------- */

let hono = `// AUTO-GENERATED scale fixture (${N} endpoints) - chained Hono app (the documented blow-up pattern)
// NOTE: every route MUST be part of one single chain expression; intermediate
// route types only flow through the builder chain.
import { Hono } from 'hono'
import { hc } from 'hono/client'

const app = new Hono()
`

const chain = []
for (let i = 0; i < N; i++) {
  const res = resources[Math.floor(i / 5)]
  const m = i % 5
  const path = m === 0 ? `/${res}` : `/${res}/:id`
  const method = ['get', 'get', 'post', 'put', 'delete'][m]
  const bodyJson =
    m === 4
      ? `c.json({ ok: true })`
      : `c.json({ ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' })`
  chain.push(`  .${method}('${path}', (c) => ${bodyJson})`)
}

hono += chain.join('\n') + '\n'

hono += `
export type AppType = typeof app
export const client = hc<AppType>('http://localhost')
export type ApiClient = typeof client

export async function demo() {
  const r = await client.res0[':id'].$get({ param: { id: 'abc' } })
  return (await r.json()).item?.name
}
`

writeFileSync('bench/src/hono.fixture.ts', hono)
console.log(`Generated ${N}-endpoint fixtures in bench/src/`)
