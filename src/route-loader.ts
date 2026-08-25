import { readdir, readFile } from 'node:fs/promises'
import { join, resolve, relative } from 'node:path'
import type { RouteImpl } from './contract.js'

export interface RouteLoaderOptions {
  /** Directory to scan for routes */
  dir?: string
  /** Glob patterns to include */
  include?: string[]
  /** Glob patterns to exclude */
  exclude?: string[]
}

/**
 * Auto-discover and load routes from a directory structure.
 * 
 * Convention:
 * - Each file exports route implementations
 * - File path becomes the route prefix
 */
export async function loadRoutes(
  options: RouteLoaderOptions = {},
): Promise<RouteImpl[]> {
  const dir = resolve(options.dir || 'src/routes')
  const routes: RouteImpl[] = []

  try {
    await scanDir(dir, '', routes)
  } catch {
    // Directory doesn't exist or is empty
  }

  return routes
}

async function scanDir(
  dir: string,
  prefix: string,
  routes: RouteImpl[],
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const routePath = prefix ? `${prefix}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      await scanDir(fullPath, routePath, routes)
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
      // Skip index files and files starting with _
      if (entry.name === 'index.ts' || entry.name === 'index.js') continue
      if (entry.name.startsWith('_')) continue

      const module = await import(fullPath)
      const exports = Object.values(module)

      for (const exp of exports) {
        if (isRouteImpl(exp)) {
          routes.push(exp)
        }
      }
    }
  }
}

function isRouteImpl(value: unknown): value is RouteImpl {
  return (
    typeof value === 'object' &&
    value !== null &&
    'contract' in value &&
    'handler' in value
  )
}
