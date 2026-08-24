import { t } from '../../src/schema.js'
import { contract, impl, createApp } from '../../src/index.js'
import { listen } from '../../src/node.js'

const routes = []
for (let i = 0; i < 100; i++) {
  const c = contract({
    method: 'GET',
    path: '/r' + i + '/item',
    responses: { 200: t.Object({ ok: t.Boolean(), i: t.Number() }) },
  })
  routes.push(impl(c, async () => ({ status: 200 as const, body: { ok: true, i } })))
}
listen(createApp(routes), Number(process.argv[2]))
