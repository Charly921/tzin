import type { App } from './server.js'
import type { RouteImpl } from './contract.js'

const PROTOCOL_VERSION = '2025-06-18'
const SERVER_INFO = { name: 'tzin', version: '0.1.0' }

/** '/users/:id' -> 'get_users_id' fallback tool name. */
function defaultToolName(c: { method: string; path: string }): string {
  return `${c.method.toLowerCase()}_${c.path.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')}`
}

/**
 * One endpoint = one MCP tool.
 * The inputSchema is assembled from the contract's declared sections —
 * TypeBox schemas are already JSON Schema, so there is no conversion layer.
 */
export function toTool(route: RouteImpl<any>): Record<string, unknown> {
  const c = route.contract
  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const section of ['params', 'query', 'body'] as const) {
    if (section in c && c[section]) {
      properties[section] = c[section]
      if (section !== 'query') required.push(section)
    }
  }

  const responseLines = Object.entries(c.responses)
    .map(([status, schema]) => {
      const desc =
        (schema as { description?: string }).description ?? ''
      return `- ${status}${desc ? `: ${desc}` : ''}`
    })
    .join('\n')

  return {
    name: c.name ?? defaultToolName(c),
    ...(c.description ? { description: c.description } : {}),
    inputSchema: { type: 'object', properties, ...(required.length ? { required } : {}) },
    annotations: {
      'x-tzin-method': c.method,
      'x-tzin-path': c.path,
      'x-tzin-responses': responseLines,
    },
  }
}

export function listTools(routes: RouteImpl<any>[]): Record<string, unknown>[] {
  return routes.map(toTool)
}

async function callTool(app: App, name: string, args: unknown): Promise<Record<string, unknown>> {
  const routes: RouteImpl<any>[] = app.routes
  const route = routes.find((r) => (r.contract.name ?? defaultToolName(r.contract)) === name)

  if (!route) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool '${name}'` }) }],
      isError: true,
    }
  }

  const a = (args ?? {}) as { params?: Record<string, string>; query?: Record<string, string>; body?: unknown }
  let path = route.contract.path.replace(/:([A-Za-z0-9_]+)/g, (_m: string, key: string) =>
    encodeURIComponent(String(a.params?.[key] ?? `{${key}}`)),
  )
  const qs = a.query ? new URLSearchParams(Object.entries(a.query).map(([k, v]) => [k, String(v)])).toString() : ''
  if (qs) path += `?${qs}`

  const init: RequestInit = { method: route.contract.method }
  if ('body' in route.contract && route.contract.body && a.body !== undefined) {
    init.body = JSON.stringify(a.body)
  }

  // In-process dispatch: validation, middleware and DI all apply.
  const res = await app.fetch(new Request(`http://mcp.local${path}`, init))
  const text = await res.text()

  if (!res.ok) {
    return {
      content: [{ type: 'text', text: `HTTP ${res.status}: ${text}` }],
      isError: true,
    }
  }

  return { content: [{ type: 'text', text }] }
}

export interface RpcRequest {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

/** Handle one MCP JSON-RPC message; returns null for notifications. */
export async function handleMcpMessage(app: App, msg: RpcRequest): Promise<Record<string, unknown> | null> {
  const reply = (result: unknown): Record<string, unknown> => ({
    jsonrpc: '2.0',
    id: msg.id ?? null,
    result,
  })
  const error = (code: number, message: string): Record<string, unknown> => ({
    jsonrpc: '2.0',
    id: msg.id ?? null,
    error: { code, message },
  })

  switch (msg.method) {
    case 'initialize':
      return reply({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      })
    case 'tools/list':
      return reply({ tools: listTools(app.routes) })
    case 'tools/call': {
      const name = String(msg.params?.name ?? '')
      const result = await callTool(app, name, msg.params?.arguments)
      return reply(result)
    }
    case 'notifications/initialized':
      return null
    case undefined:
    default:
      if (msg.method?.startsWith('notifications/')) return null
      return error(-32601, `Method not found: ${String(msg.method)}`)
  }
}
