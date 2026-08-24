export interface RouteMatch<T> {
  route: T
  params: Record<string, string>
}

/** The path resolves to a registered endpoint but the method differs (405). */
export interface MethodMismatch {
  allow: string[]
}

export type LookupResult<T> = RouteMatch<T> | MethodMismatch | null

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
 *
 * A resolved terminal node with handlers but none for the requested method
 * yields a MethodMismatch (405 + Allow); an unresolved path yields null (404).
 */
export function createMatcher<T>(entries: MatcherEntry<T>[]): (method: string, pathname: string) => LookupResult<T> {
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
    if (hit) return { route: hit.route, params }
    if (node.handlers.size > 0) return { allow: [...node.handlers.keys()] }
    return null
  }
}
