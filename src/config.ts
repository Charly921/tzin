import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

export interface TzinConfig {
  /** Port to listen on (default: 3000) */
  port?: number
  /** Enable OpenAPI at /openapi.json */
  openapi?: boolean
  /** Enable MCP at POST /mcp */
  mcp?: boolean
  /** Enable /llms.txt and /llms-full.txt */
  llms?: boolean
  /** API metadata for OpenAPI/MCP */
  meta?: {
    title?: string
    description?: string
    version?: string
  }
  /** Glob patterns for auto-loading routes */
  routes?: string[]
  /** Glob patterns for auto-loading middleware */
  middleware?: string[]
  /** Entry point for the app (default: src/app.ts) */
  entry?: string
}

const CONFIG_FILES = [
  'tzin.config.ts',
  'tzin.config.js',
  'tzin.config.mjs',
  'tzin.config.json',
]

export function loadConfig(cwd: string = process.cwd()): TzinConfig | null {
  for (const file of CONFIG_FILES) {
    const path = resolve(cwd, file)
    if (existsSync(path)) {
      try {
        // For .ts files, we need to use a loader
        if (file.endsWith('.ts')) {
          // Return null for now - will be handled by tsx loader
          return null
        }
        // For .js/.mjs, import dynamically
        const config = require(path)
        return config.default || config
      } catch {
        return null
      }
    }
  }
  return null
}

export function defineConfig(config: TzinConfig): TzinConfig {
  return config
}
