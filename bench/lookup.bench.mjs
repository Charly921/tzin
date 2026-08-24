// Micro-benchmark: linear regex scan (old router) vs radix trie (new).
// 100 routes; target is the LAST registered one to force worst case for linear.
import { performance } from 'node:perf_hooks'
import { createMatcher } from '../src/router.js'

const N = 100
const TARGET = '/r99/item'

const paths = Array.from({ length: N }, (_, i) => `/r${i}/item`)

const linear = paths.map((p) => {
  const keys = []
  const source =
    '^' +
    p.replace(/\/:([A-Za-z0-9_]+)/g, (_m, key) => {
      keys.push(key)
      return '/([^/]+)'
    }) +
    '/?$'
  return { pattern: new RegExp(source), keys }
})

function linearLookup(pathname) {
  for (const { pattern, keys } of linear) {
    const m = pattern.exec(pathname)
    if (m) {
      const params = {}
      keys.forEach((k, i) => (params[k] = m[i + 1]))
      return params
    }
  }
  return null
}

const trie = createMatcher(paths.map((p) => ({ method: 'GET', path: p, route: p })))

const ITERS = 1_000_000

function bench(name, fn) {
  fn()
  const t0 = performance.now()
  for (let i = 0; i < ITERS; i++) fn()
  const ms = performance.now() - t0
  console.log(`${name.padEnd(22)} ${(ITERS / (ms / 1000) / 1e6).toFixed(2)}M lookups/s`)
}

bench('linear scan (old)', () => linearLookup(TARGET))
bench('radix trie (new)', () => trie('GET', TARGET))
