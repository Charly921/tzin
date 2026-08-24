// Verify native WebSockets on Bun: channels over WS, self-tested.
import { Hub, Presence, channelRoutes } from '../src/index.js'
import { contract, impl, createApp } from '../src/index.js'
import { t } from '../src/schema.js'
import { wsChannels } from '../src/ws.js'
import { serve } from '../src/bun.js'

const health = contract({
  method: 'GET',
  path: '/health',
  responses: { 200: t.Object({ status: t.String() }) },
})

const hub = new Hub()
const presence = new Presence(hub, 30_000)
const app = createApp([
  impl(health, async () => ({ status: 200 as const, body: { status: 'ok' } })),
  ...channelRoutes(hub, { presence }),
])

const PORT = 4621
serve(app, PORT, { wsRoutes: [wsChannels(hub, { presence })] })

// Self-test with Bun's global WebSocket client.
await new Promise<void>((resolve, reject) => {
  const ws = new WebSocket(`ws://localhost:${PORT}/channels/room?member=ada`)
  let gotPresence = false
  const timeout = setTimeout(() => reject(new Error('timeout')), 4000)
  ws.onopen = () => {
    console.log('ws open')
    ws.send(JSON.stringify({ type: 'push', event: 'greet', data: { text: 'bun!' } }))
  }
  ws.onmessage = (ev) => {
    const f = JSON.parse(String(ev.data))
    if (f.event === 'presence_state') {
      gotPresence = true
      console.log('presence_state members:', f.data.members.map((m: any) => m.member))
      return
    }
    if (f.event === 'greet') {
      clearTimeout(timeout)
      console.log('broadcast received:', f.data.text)
      console.log(
        `WS OK: ${gotPresence ? 'presence + ' : ''}echo via hub ✓ (runtime: ${typeof Bun})`,
      )
      ws.close()
      resolve()
    }
  }
  ws.onerror = () => {
    clearTimeout(timeout)
    reject(new Error('ws error'))
  }
})
process.exit(0)
