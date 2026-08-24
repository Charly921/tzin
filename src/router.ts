export interface RouteMatch<T> {
  route: T
  params: Record<string, string>
}

interface Node<T> {
  static: Map<string, Node<T>>
  param?: { name: string; node: Node<T> }
  handlers: Map<string, { route: T; order: number }>
}

function emptyNode<T>(): Node<T> {
  return { static: new Map(), handlers: new Map() }
}

function segments(pathname: string): string[] {
  const s = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return s.split('/').filter(Boolean)
}

export interface MatcherEntry<T> {
  method: string
  path: string
  route: T
}

/**
 * Radix-trie matcher built once at app creation: lookup cost is O(path depth),
 * independent of route count. Static segments win over dynamic ones; ties on
 * the same terminal node resolve by insertion order (first registration wins).
 */
export function createMatcher<T>(entries: MatcherEntry<T>[]): (method: string, pathname: string) => RouteMatch<T> | null {
  const root = emptyNode<T>()
  let order = 0

  for (const entry of entries) {
    let node = root
    for (const seg of segments(entry.path)) {
      if (seg.startsWith(':')) {
        const name = seg.slice(1)
        if (!node.param) {
          node.param = { name, node: emptyNode<T>() }
        }
        node = node.param.node
      } else {
        let child = node.static.get(seg)
        if (!child) {
          child = emptyNode<T>()
          node.static.set(seg, child)
        }
        node = child
      }
    }
    if (!node.handlers.has(entry.method)) {
      node.handlers.set(entry.method, { route: entry.route, order: order++ })
    }
  }

  return (method, pathname) => {
    let node: Node<T> = root
    const params: Record<string, string> = {}

    for (const seg of segments(pathname)) {
      const next: Node<T> | undefined = node.static.get(seg) ?? node.param?.node
      if (!next) return null
      if (!node.static.has(seg)) params[node.param!.name] = decodeURIComponent(seg)
      node = next
    }

    const hit = node.handlers.get(method)
    if (!hit) return null
    return { route: hit.route, params }
  }
}
