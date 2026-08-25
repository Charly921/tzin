import { t, contract, impl, HttpError } from '@carlos-tzin/tzin'
import { AUTH_USER } from '@carlos-tzin/tzin/auth'

export const getUser = contract({
  method: 'GET',
  path: '/users/:id',
  name: 'get_user',
  description: 'Get a user by ID',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ id: t.String(), name: t.String() }),
    401: t.Object({ error: t.String() }),
    404: t.Object({ error: t.String() }),
  },
})

export const listUsers = contract({
  method: 'GET',
  path: '/users',
  name: 'list_users',
  description: 'List all users',
  responses: {
    200: t.Array(t.Object({ id: t.String(), name: t.String() })),
  },
})

export const createUser = contract({
  method: 'POST',
  path: '/users',
  name: 'create_user',
  description: 'Create a new user',
  body: t.Object({ name: t.String(), email: t.String() }),
  responses: {
    201: t.Object({ id: t.String(), name: t.String() }),
    400: t.Object({ error: t.String() }),
  },
})

// In-memory store (replace with db in production)
const users = new Map<string, { id: string; name: string }>()

export const getUserRoute = impl(getUser, async ({ params }) => {
  const user = users.get(params.id)
  if (!user) throw new HttpError(404, 'User not found')
  return { status: 200 as const, body: user }
})

export const listUsersRoute = impl(listUsers, async () => {
  return { status: 200 as const, body: [...users.values()] }
})

export const createUserRoute = impl(createUser, async ({ body }) => {
  const id = crypto.randomUUID()
  const user = { id, name: body.name }
  users.set(id, user)
  return { status: 201 as const, body: user }
})

export const usersRoute = [getUserRoute, listUsersRoute, createUserRoute]
