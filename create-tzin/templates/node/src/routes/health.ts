import { t } from '@carlos-tzin/tzin'
import { contract, impl } from '@carlos-tzin/tzin'

const health = contract({
  method: 'GET',
  path: '/health',
  responses: {
    200: t.Object({ status: t.String() }),
  },
})

export const healthRoute = impl(health, async () => ({
  status: 200 as const,
  body: { status: 'ok' },
}))
