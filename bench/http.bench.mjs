// HTTP throughput bench: tzin vs hono vs express, 100 routes each.
// Each variant runs in its own process; autocannon hits /r50/item for 5s.
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import autocannon from 'autocannon'

const PORT_BASE = 4700
const N = 100

const variants = {
  // Runs from built dist with plain node — no runtime TS transform skew.
  tzin: `import { t } from '../dist/schema.js'
import { contract, impl, createApp } from '../dist/index.js'
import { listen } from '../dist/node.js'

const routes = []
for (let i = 0; i < ${N}; i++) {
  const c = contract({
    method: 'GET',
    path: '/r' + i + '/item',
    responses: { 200: t.Object({ ok: t.Boolean(), i: t.Number() }) },
  })
  routes.push(impl(c, async () => ({ status: 200, body: { ok: true, i } })))
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
  // Raw node:http ceiling — what the hardware/stack allows without any framework.
  floor: `import { createServer } from 'node:http'
createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end('{"ok":true,"i":50}')
}).listen(Number(process.argv[2]))
`,
}

const results = []
// Machine state drifts across sequential runs (thermal/noise) and biases
// whichever variant happens to run last. Rotate the order every round and
// take the median per variant so no variant owns the "cold" slot.
const rounds = Number(process.env.ROUNDS || 3)
for (let round = 0; round < rounds; round++) {
  const names = Object.keys(variants)
  const order = names.slice(round % names.length).concat(names.slice(0, round % names.length))
  for (const name of order) {
    const code = variants[name]
  const file = new URL(`.http-${name}.mjs`, import.meta.url)
  writeFileSync(file, code)
  const port = PORT_BASE + results.length
  const child = spawn(process.execPath, [fileURLToPath(file), String(port)], {
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
  await new Promise((r) => setTimeout(r, 500))
  }
}

const medians = new Map()
for (const name of Object.keys(variants)) {
  const rps = results.filter((r) => r.name === name).map((r) => r.rps).sort((a, b) => a - b)
  const mid = Math.floor(rps.length / 2)
  const m = rps.length % 2 ? rps[mid] : (rps[mid - 1] + rps[mid]) / 2
  const lats = results.filter((r) => r.name === name).map((r) => r.lat99).sort((a, b) => a - b)
  medians.set(name, { rps: m, lat99: lats[Math.floor(lats.length / 2)] })
}

console.log(`\nHTTP throughput — 100 routes, GET /r50/item, 64 connections, ${rounds} rotated rounds (median):`)
for (const [name, r] of [...medians].sort((a, b) => b[1].rps - a[1].rps)) {
  console.log(
    `${name.padEnd(8)} ${String(Math.round(r.rps)).padStart(7)} req/s   p99 ${r.lat99}ms`,
  )
}
