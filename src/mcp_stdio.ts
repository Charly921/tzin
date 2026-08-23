import { createInterface } from 'node:readline'
import type { App } from './server.js'
import { handleMcpMessage, type RpcRequest } from './mcp.js'

/**
 * Minimal MCP stdio transport: newline-delimited JSON-RPC on stdin/stdout.
 * Point an MCP client at a small entryfile that builds the app and calls this.
 */
export function startStdioMcp(app: App): void {
  const out = process.stdout
  const rl = createInterface({ input: process.stdin })

  rl.on('line', async (line) => {
    if (!line.trim()) return
    let msg: RpcRequest
    try {
      msg = JSON.parse(line)
    } catch {
      out.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error' },
        }) + '\n',
      )
      return
    }

    const res = await handleMcpMessage(app, msg)
    if (res) out.write(JSON.stringify(res) + '\n')
  })
}
