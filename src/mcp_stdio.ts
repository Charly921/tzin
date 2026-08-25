import { createInterface } from 'node:readline'
import type { Readable, Writable } from 'node:stream'
import type { App } from './server.js'
import { handleMcpMessage, type RpcRequest } from './mcp.js'

/**
 * Minimal MCP stdio transport: newline-delimited JSON-RPC on an input stream,
 * responses written as newline-delimited JSON-RPC on an output stream.
 * Streams are injectable for tests; startStdioMcp wires the real ones.
 */
export function startStdioMcpFromStreams(app: App, input: Readable, out: Writable): void {
  const rl = createInterface({ input })

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

/** Point an MCP client at a small entryfile that builds the app and calls this. */
export function startStdioMcp(app: App): void {
  startStdioMcpFromStreams(app, process.stdin, process.stdout)
}
