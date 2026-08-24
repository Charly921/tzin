import { pathToFileURL } from 'node:url'
import type { App } from './server.js'
import type { RouteImpl } from './contract.js'
import { listen } from './node.js'

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}

function printRouteTable(routes: RouteImpl<any>[]): void {
  console.log(`\ntzin dev · ${routes.length} routes\n`)
  for (const { contract: c } of routes) {
    const method = `\x1b[36m${pad(c.method, 7)}\x1b[0m`
    const name = c.name ? ` \x1b[2m${c.name}\x1b[0m` : ''
    const desc = c.description ? `  \x1b[2m— ${c.description}\x1b[0m` : ''
    console.log(`  ${method} ${pad(c.path, 34)}${name}${desc}`)
  }
  console.log('')
}

const entry = process.argv[2]
const port = Number(process.argv[3] ?? 3000)

if (!entry) {
  console.error('usage: dev-server <entry-file> [port]')
  process.exit(1)
}

const mod = await import(pathToFileURL(entry).href)
const app: App | undefined = mod.default ?? mod.app

if (!app || typeof app.fetch !== 'function' || !Array.isArray(app.routes)) {
  console.error('entry file must default-export (or export `app`) a tzin App')
  process.exit(1)
}

printRouteTable(app.routes)
listen(app, port)
console.log(`\x1b[32m➜\x1b[0m http://localhost:${port}  (watching for changes)`)
