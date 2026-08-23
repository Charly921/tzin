// Minimal MCP client probe: spawns the demo server and speaks NDJSON JSON-RPC.
import { spawn } from 'node:child_process'

const child = spawn('npx', ['tsx', 'examples/mcp-demo.ts'], {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: ['pipe', 'pipe', 'inherit'],
})

let buf = ''
let nextId = 1
const pending = new Map()

child.stdout.on('data', (chunk) => {
  buf += chunk.toString()
  let idx
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim()
    buf = buf.slice(idx + 1)
    if (!line) continue
    try {
      const msg = JSON.parse(line)
      const resolve = pending.get(msg.id)
      if (resolve) {
        pending.delete(msg.id)
        resolve(msg)
      }
    } catch {}
  }
})

function request(method, params = {}) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, resolve)
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id)
        reject(new Error(`timeout waiting for ${method}`))
      }
    }, 5000)
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  })
}

function notify(method, params = {}) {
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n')
}

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

try {
  const init = await request('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'tzin-probe', version: '0.0.0' },
  })
  check(
    'initialize handshake',
    init.result?.serverInfo?.name === 'tzin' && !!init.result?.protocolVersion,
    `protocol=${init.result?.protocolVersion}`,
  )
  notify('notifications/initialized')

  const tools = await request('tools/list')
  const names = (tools.result?.tools ?? []).map((t) => t.name)
  check(
    'tools/list',
    names.includes('get_user') && names.includes('search_users'),
    names.join(', '),
  )

  const schema = (tools.result?.tools ?? []).find((t) => t.name === 'get_user')?.inputSchema
  check(
    'tool inputSchema is real JSON Schema',
    schema?.type === 'object' && schema?.required?.includes('params'),
    JSON.stringify(schema?.properties ? Object.keys(schema.properties) : []),
  )

  const call = await request('tools/call', {
    name: 'get_user',
    arguments: { params: { id: '2' } },
  })
  const payload = JSON.parse(call.result?.content?.[0]?.text ?? '{}')
  check(
    'tools/call get_user',
    !call.result?.isError && payload.name === 'Alan Turing',
    JSON.stringify(payload),
  )

  const search = await request('tools/call', {
    name: 'search_users',
    arguments: { query: { q: 'ada' } },
  })
  const found = JSON.parse(search.result?.content?.[0]?.text ?? '[]')
  check(
    'tools/call search_users with query',
    Array.isArray(found) && found[0]?.id === '1',
    JSON.stringify(found),
  )

  const miss = await request('tools/call', {
    name: 'get_user',
    arguments: { params: { id: '999' } },
  })
  check(
    'HTTP error surfaces as isError',
    miss.result?.isError === true && miss.result.content[0].text.includes('404'),
    miss.result?.content?.[0]?.text,
  )

  const flat = await request('tools/call', {
    name: 'get_user',
    arguments: { id: '1' },
  })
  check(
    'flat top-level args (MCP client convention)',
    !flat.result?.isError && JSON.parse(flat.result?.content?.[0]?.text ?? '{}').name === 'Ada Lovelace',
    flat.result?.content?.[0]?.text,
  )

  const noArgs = await request('tools/call', { name: 'get_user', arguments: {} })
  check(
    'missing path param fails with clear message',
    noArgs.result?.isError === true &&
      noArgs.result.content[0].text.includes('params.id'),
    noArgs.result?.content?.[0]?.text,
  )

  const bogus = await request('tools/call', { name: 'nope', arguments: {} })
  check(
    'unknown tool is isError',
    bogus.result?.isError === true,
    '',
  )
} catch (err) {
  check(err.message, false)
} finally {
  child.kill()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
