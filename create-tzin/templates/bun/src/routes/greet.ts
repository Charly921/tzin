import { t } from '@carlos-tzin/tzin'
import { contract, impl } from '@carlos-tzin/tzin'

const greet = contract({
  method: 'GET',
  path: '/greet/:name',
  params: t.Object({ name: t.String() }),
  responses: {
    200: t.Object({ message: t.String() }),
  },
})

export const greetRoute = impl(greet, async ({ params }) => ({
  status: 200 as const,
  body: { message: `Hello, ${params.name}!` },
}))
