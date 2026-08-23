/**
 * Server-Sent Events helper. Returns a raw Response streaming
 * `text/event-stream`; closes when the producer finishes or the
 * client disconnects (request abort signal).
 */
import { raw, type RawResult } from './contract.js'

export interface SseSender {
  event(name: string, data: unknown): void
  comment(text: string): void
}

export function sse(produce: (send: SseSender) => Promise<void>): RawResult {
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const write = (chunk: string): void => {
        if (!closed) controller.enqueue(encoder.encode(chunk))
      }
      const send: SseSender = {
        event: (name, data) =>
          write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`),
        comment: (text) => write(`: ${text}\n\n`),
      }
      try {
        await produce(send)
      } finally {
        closed = true
        controller.close()
      }
    },
  })

  return raw(
    new Response(stream, {
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      },
    }),
  )
}
