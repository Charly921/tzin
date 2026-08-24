// Attribute tzin's in-process cost layer by layer.
import { performance } from 'node:perf_hooks'
import { Value } from '@sinclair/typebox/value'
import { createMatcher } from '../src/router.js'
import { Ctx } from '../src/context.js'
import { t } from '../src/schema.js'

const N = 200_000
const pathname = '/r50/item'
const method = 'GET'

function bench(name, fn) {
  return (async () => {
    for (let i = 0; i < 10_000; i++) fn()
    const t0 = performance.now()
    for (let i = 0; i < N; i++) fn()
    const ns = ((performance.now() - t0) * 1e6) / N
    console.log(`${name.padEnd(44)} ${ns.toFixed(0).padStart(5)} ns/op`)
  })()
}

const { contract, impl, createApp } = await import('../src/index.js')
const getUser = contract({
  method: 'GET',
  path: '/r50/item',
  params: t.Object({ id: t.String() }),
  responses: { 200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String() }) }) },
})
const route = impl(getUser, async ({ params }) => ({
  status: 200,
  body: { ok: true, item: { id: params.id, name: 'thing' } },
}))
const app = createApp([route])

await bench('segments(): split+filter', () => {
  const s = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  s.split('/').filter(Boolean)
})

const matchRoute = createMatcher([{ method: 'GET', path: '/r50/:id', route }])
await bench('trie lookup (full matchRoute)', () => matchRoute(method, pathname))

await bench('new Ctx()', () => new Ctx())

const paramsSchema = getUser.params
await bench('Value.Check(params)', () =>
  Value.Check(paramsSchema, { id: 'item' }),
)

await bench('decodeURIComponent("item")', () => decodeURIComponent('item'))

await bench('full app.fetch', async () => {
  await app.fetch(new Request('http://x/r50/item'))
})
