// In-process pipeline bench: isolates framework cost from TCP/adapter noise.
// Calls app.fetch directly in a tight loop — same Request construction for all.
import { performance } from 'node:perf_hooks'
import { Hono } from 'hono'

const N = 100_000

function bench(name, fn) {
  return (async () => {
    for (let i = 0; i < 5_000; i++) await fn() // warmup
    const t0 = performance.now()
    for (let i = 0; i < N; i++) await fn()
    const dt = (performance.now() - t0) / 1000
    const rps = Math.round(N / dt)
    console.log(`${name.padEnd(28)} ${String(rps).padStart(9)} req/s`)
    return rps
  })()
}

const results = []

// 1. Absolute floor: construct Request + Response.json, zero framework.
results.push(
  await bench('[floor] Request -> Response.json', () => {
    const res = Response.json({ ok: true })
    return res.arrayBuffer()
  }),
)

// 2. tzin: full app.fetch (trie lookup + validation + dispatch).
{
  const { contract, impl, createApp } = await import('../src/index.js')
  const { t } = await import('../src/schema.js')
  const getItem = contract({
    method: 'GET',
    path: '/r50/:id',
    params: t.Object({ id: t.String() }),
    responses: { 200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String() }) }) },
  })
  const app = createApp([
    impl(getItem, async ({ params }) => ({
      status: 200,
      body: { ok: true, item: { id: params.id, name: 'thing' } },
    })),
  ])
  results.push(
    await bench('tzin app.fetch', async () => {
      const res = await app.fetch(new Request('http://x/r50/item'))
      if (res.status !== 200) throw new Error('non-200 in bench')
    }),
  )
}

// 3. Hono: equivalent route.
{
  const app = new Hono()
  app.get('/r50/:id', (c) => c.json({ ok: true, item: { id: 'abc', name: 'thing' } }))
  results.push(
    await bench('hono app.fetch', async () => {
      const res = await app.request('/r50/item')
      if (res.status !== 200) throw new Error('non-200 in bench')
    }),
  )
}

console.log('\n--- summary ---')
const [floor, tzin, hono] = results
console.log(`tzin overhead over floor:   ${(floor / tzin).toFixed(2)}x`)
console.log(`hono overhead over floor:   ${(floor / hono).toFixed(2)}x`)
console.log(`tzin vs hono:               ${(hono / tzin).toFixed(2)}x`)
