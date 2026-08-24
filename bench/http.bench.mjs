// HTTP throughput bench: tzin vs hono vs express, 100 routes each.
// Each variant runs in its own process; autocannon hits /r50/item for 5s.
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import autocannon from 'autocannon'

const PORT_BASE = 4700
const N = 100

const variants = {
  tzin: `import { t } from '../src/schema.js'
import { contract, impl, createApp } from '../src/index.js'
import { listen } from '../src/node.js'

const routes = []
for (let i = 0; i < ${N}; i++) {
  const c = contract({
    method: 'GET',
    path: '/r' + i + '/item',
    responses: { 200: t.Object({ ok: t.Boolean(), i: t.Number() }) },
  })
  routes.push(impl(c, async () => ({ status: 200 as const, body: { ok: true, i } })))
}
listen(createApp(routes), Number(process.argv[2]))
`,
  hono: `import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()
for (let i = 0; i < ${N}; i++) app.get('/r' + i + '/item', (c) => c.json({ ok: true, i }))
serve({ fetch: app.fetch, port: Number(process.argv[2]) })
`,
  express: `import express from 'express'

const app = express()
for (let i = 0; i < ${N}; i++) app.get('/r' + i + '/item', (_req, res) => res.json({ ok: true, i }))
app.listen(Number(process.argv[2]))
`,
}

const results = []
for (const [name, code] of Object.entries(variants)) {
  const file = new URL(`.http-${name}.ts`, import.meta.url)
  writeFileSync(file, code)
  const port = PORT_BASE + results.length
  const child = spawn('npx', ['tsx', fileURLToPath(file), String(port)], {
    cwd: new URL('..', import.meta.url).pathname,
    stdio: 'ignore',
  })

  let up = false
  for (let i = 0; i < 40 && !up; i++) {
    await new Promise((r) => setTimeout(r, 250))
    try {
      const res = await fetch(`http://localhost:${port}/r50/item`)
      up = res.ok
    } catch {}
  }
  if (!up) throw new Error(`${name} did not start`)

  const result = await autocannon({
    url: `http://localhost:${port}/r50/item`,
    connections: 64,
    duration: 5,
  })
  results.push({ name, rps: result.requests.average, lat99: result.latency.p99 })
  child.kill('SIGKILL')
}

console.log('\nHTTP throughput — 100 routes, GET /r50/item, 64 connections, 5s:')
for (const r of results.sort((a, b) => b.rps - a.rps)) {
  console.log(
    `${r.name.padEnd(8)} ${String(Math.round(r.rps)).padStart(7)} req/s   p99 ${r.lat99}ms`,
  )
}
