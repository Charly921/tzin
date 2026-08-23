export interface PathMatcher {
  pattern: RegExp
  keys: string[]
}

const cache = new Map<string, PathMatcher>()

/** Compile '/users/:id' into a regex with positional groups. Cached. */
export function compilePath(path: string): PathMatcher {
  const hit = cache.get(path)
  if (hit) return hit
  const keys: string[] = []
  const source =
    '^' +
    path.replace(/\/:([A-Za-z0-9_]+)/g, (_m, key: string) => {
      keys.push(key)
      return '/([^/]+)'
    }) +
    '/?$'
  const matcher = { pattern: new RegExp(source), keys }
  cache.set(path, matcher)
  return matcher
}

export function matchPath(
  path: string,
  pathname: string,
): Record<string, string> | null {
  const { pattern, keys } = compilePath(path)
  const m = pattern.exec(pathname)
  if (!m) return null
  const params: Record<string, string> = {}
  keys.forEach((key, i) => {
    params[key] = decodeURIComponent(m[i + 1])
  })
  return params
}
