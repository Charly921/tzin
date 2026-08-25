import { describe, it, expect, beforeEach } from 'vitest'
import { t } from '../src/index.js'
import { defineModel, resetStore } from '../src/db.js'

const UserSchema = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
})

describe('defineModel', () => {
  beforeEach(() => {
    resetStore()
  })

  it('creates a model', () => {
    const User = defineModel('users', UserSchema)
    expect(User.tableName).toBe('users')
    expect(User.schema).toBe(UserSchema)
  })

  it('finds by id', async () => {
    const User = defineModel('users', UserSchema)
    await User.create({ id: '1', name: 'Ada', email: 'ada@example.com' })

    const user = await User.findById('1')
    expect(user).toEqual({ id: '1', name: 'Ada', email: 'ada@example.com' })
  })

  it('returns null for missing id', async () => {
    const User = defineModel('users', UserSchema)
    const user = await User.findById('999')
    expect(user).toBeNull()
  })

  it('creates records', async () => {
    const User = defineModel('users', UserSchema)
    const user = await User.create({ id: '1', name: 'Ada', email: 'ada@example.com' })
    expect(user).toEqual({ id: '1', name: 'Ada', email: 'ada@example.com' })
  })

  it('creates many records', async () => {
    const User = defineModel('users', UserSchema)
    const users = await User.createMany([
      { id: '1', name: 'Ada', email: 'ada@example.com' },
      { id: '2', name: 'Grace', email: 'grace@example.com' },
    ])
    expect(users).toHaveLength(2)
  })

  it('finds first matching record', async () => {
    const User = defineModel('users', UserSchema)
    await User.create({ id: '1', name: 'Ada', email: 'ada@example.com' })
    await User.create({ id: '2', name: 'Grace', email: 'grace@example.com' })

    const user = await User.findFirst({ name: 'Grace' })
    expect(user?.id).toBe('2')
  })

  it('updates records', async () => {
    const User = defineModel('users', UserSchema)
    await User.create({ id: '1', name: 'Ada', email: 'ada@example.com' })

    const updated = await User.update('1', { name: 'Ada Lovelace' })
    expect(updated?.name).toBe('Ada Lovelace')
  })

  it('deletes records', async () => {
    const User = defineModel('users', UserSchema)
    await User.create({ id: '1', name: 'Ada', email: 'ada@example.com' })

    const deleted = await User.delete('1')
    expect(deleted).toBe(true)

    const user = await User.findById('1')
    expect(user).toBeNull()
  })

  it('counts records', async () => {
    const User = defineModel('users', UserSchema)
    await User.create({ id: '1', name: 'Ada', email: 'ada@example.com' })
    await User.create({ id: '2', name: 'Grace', email: 'grace@example.com' })

    const count = await User.count()
    expect(count).toBe(2)
  })

  it('finds many with where', async () => {
    const User = defineModel('users', UserSchema)
    await User.create({ id: '1', name: 'Ada', email: 'ada@example.com' })
    await User.create({ id: '2', name: 'Grace', email: 'grace@example.com' })

    const users = await User.findMany().where('name', 'Ada').exec()
    expect(users).toHaveLength(1)
    expect(users[0].name).toBe('Ada')
  })

  it('limits results', async () => {
    const User = defineModel('users', UserSchema)
    await User.create({ id: '1', name: 'Ada', email: 'ada@example.com' })
    await User.create({ id: '2', name: 'Grace', email: 'grace@example.com' })
    await User.create({ id: '3', name: 'Alan', email: 'alan@example.com' })

    const users = await User.findMany().limit(2).exec()
    expect(users).toHaveLength(2)
  })

  it('orders results', async () => {
    const User = defineModel('users', UserSchema)
    await User.create({ id: '1', name: 'Grace', email: 'grace@example.com' })
    await User.create({ id: '2', name: 'Ada', email: 'ada@example.com' })

    const users = await User.findMany().orderBy('name', 'asc').exec()
    expect(users[0].name).toBe('Ada')
    expect(users[1].name).toBe('Grace')
  })
})
