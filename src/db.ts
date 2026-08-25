import type { TSchema } from '@sinclair/typebox'
import { Value } from './schema.js'

// ── Types ────────────────────────────────────────────────────────────

export type SchemaToType<S> = S extends TSchema ? ReturnType<S['Decode']> : never

export interface ModelConfig {
  /** Primary key field (default: 'id') */
  primaryKey?: string
}

export interface QueryBuilder<T> {
  /** Filter by field equality */
  where(field: keyof T, value: T[keyof T]): QueryBuilder<T>
  /** Filter by field inequality */
  whereNot(field: keyof T, value: T[keyof T]): QueryBuilder<T>
  /** Filter with greater than */
  whereGt(field: keyof T, value: number): QueryBuilder<T>
  /** Filter with less than */
  whereLt(field: keyof T, value: number): QueryBuilder<T>
  /** Limit results */
  limit(n: number): QueryBuilder<T>
  /** Offset results */
  offset(n: number): QueryBuilder<T>
  /** Order by field */
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): QueryBuilder<T>
  /** Select specific fields */
  select<K extends keyof T>(...fields: K[]): QueryBuilder<Pick<T, K>>
  /** Execute query and return results */
  exec(): Promise<T[]>
  /** Execute query and return first result */
  first(): Promise<T | null>
  /** Count results */
  count(): Promise<number>
}

export interface Model<T, S extends TSchema> {
  /** Find by primary key */
  findById(id: string): Promise<T | null>
  /** Find first matching record */
  findFirst(where: Partial<T>): Promise<T | null>
  /** Find many matching records */
  findMany(where?: Partial<T>): QueryBuilder<T>
  /** Create a new record */
  create(data: T): Promise<T>
  /** Create many records */
  createMany(data: T[]): Promise<T[]>
  /** Update by primary key */
  update(id: string, data: Partial<T>): Promise<T | null>
  /** Delete by primary key */
  delete(id: string): Promise<boolean>
  /** Delete many matching records */
  deleteMany(where: Partial<T>): Promise<number>
  /** Count records */
  count(where?: Partial<T>): Promise<number>
  /** Execute raw query */
  raw(sql: string, ...args: unknown[]): Promise<T[]>
  /** Schema validation */
  readonly schema: S
  /** Table name */
  readonly tableName: string
}

// ── In-memory store (swap with real DB adapter) ─────────────────────

export interface Store {
  findAll(table: string): Record<string, unknown>[]
  findById(table: string, id: string, pk: string): Record<string, unknown> | null
  insert(table: string, data: Record<string, unknown>): Record<string, unknown>
  update(table: string, id: string, data: Record<string, unknown>, pk: string): Record<string, unknown> | null
  delete(table: string, id: string, pk: string): boolean
  deleteWhere(table: string, where: Record<string, unknown>, pk: string): number
  count(table: string, where?: Record<string, unknown>): number
  query(table: string, filters: Filter[]): Record<string, unknown>[]
}

interface Filter {
  field: string
  op: '=' | '!=' | '>' | '<'
  value: unknown
}

// ── Memory store (default) ──────────────────────────────────────────

class MemoryStore implements Store {
  private data = new Map<string, Record<string, unknown>[]>()

  private table(table: string): Record<string, unknown>[] {
    if (!this.data.has(table)) this.data.set(table, [])
    return this.data.get(table)!
  }

  findAll(table: string): Record<string, unknown>[] {
    return [...this.table(table)]
  }

  findById(table: string, id: string, pk: string): Record<string, unknown> | null {
    return this.table(table).find((r) => r[pk] === id) ?? null
  }

  insert(table: string, data: Record<string, unknown>): Record<string, unknown> {
    this.table(table).push({ ...data })
    return data
  }

  update(table: string, id: string, data: Record<string, unknown>, pk: string): Record<string, unknown> | null {
    const row = this.table(table).find((r) => r[pk] === id)
    if (!row) return null
    Object.assign(row, data)
    return { ...row }
  }

  delete(table: string, id: string, pk: string): boolean {
    const rows = this.table(table)
    const idx = rows.findIndex((r) => r[pk] === id)
    if (idx === -1) return false
    rows.splice(idx, 1)
    return true
  }

  deleteWhere(table: string, where: Record<string, unknown>, pk: string): number {
    const rows = this.table(table)
    const before = rows.length
    this.data.set(table, rows.filter((r) => !Object.entries(where).every(([k, v]) => r[k] === v)))
    return before - this.data.get(table)!.length
  }

  count(table: string, where?: Record<string, unknown>): number {
    if (!where) return this.table(table).length
    return this.table(table).filter((r) => Object.entries(where).every(([k, v]) => r[k] === v)).length
  }

  query(table: string, filters: Filter[]): Record<string, unknown>[] {
    return this.table(table).filter((row) =>
      filters.every((f) => {
        const val = row[f.field]
        if (f.op === '=') return val === f.value
        if (f.op === '!=') return val !== f.value
        if (f.op === '>') return (val as number) > (f.value as number)
        if (f.op === '<') return (val as number) < (f.value as number)
        return true
      }),
    )
  }
}

// ── Global store ─────────────────────────────────────────────────────

let globalStore: Store = new MemoryStore()

/** Set a custom store adapter (e.g., for SQL databases) */
export function setStore(store: Store): void {
  globalStore = store
}

/** Get the current store (useful for testing) */
export function getStore(): Store {
  return globalStore
}

/** Reset the store (useful for testing) */
export function resetStore(): void {
  globalStore = new MemoryStore()
}

// ── defineModel ──────────────────────────────────────────────────────

/**
 * Define a typed database model.
 *
 * @example
 * ```ts
 * import { defineModel } from '@carlos-tzin/tzin/db'
 * import { t } from '@carlos-tzin/tzin'
 *
 * const User = defineModel('users', t.Object({
 *   id: t.String(),
 *   name: t.String(),
 *   email: t.String(),
 * }))
 *
 * const user = await User.findById('1')
 * ```
 */
export function defineModel<S extends TSchema>(
  tableName: string,
  schema: S,
  config?: ModelConfig,
): Model<SchemaToType<S>, S> {
  const pk = config?.primaryKey ?? 'id'

  function applyFilters(rows: Record<string, unknown>[], filters: Filter[]): Record<string, unknown>[] {
    return globalStore.query(tableName, filters)
  }

  return {
    schema,
    tableName,

    async findById(id) {
      const row = globalStore.findById(tableName, id, pk)
      return row ? (schema.Decode(row as never) as SchemaToType<S>) : null
    },

    async findFirst(where) {
      const rows = globalStore.findAll(tableName).filter((r) =>
        Object.entries(where).every(([k, v]) => r[k] === v),
      )
      return rows[0] ? (schema.Decode(rows[0] as never) as SchemaToType<S>) : null
    },

    findMany(where) {
      const filters: Filter[] = where
        ? Object.entries(where).map(([field, value]) => ({ field, op: '=' as const, value }))
        : []

      const builder: QueryBuilder<SchemaToType<S>> = {
        where(field, value) {
          filters.push({ field: field as string, op: '=', value })
          return builder
        },
        whereNot(field, value) {
          filters.push({ field: field as string, op: '!=', value })
          return builder
        },
        whereGt(field, value) {
          filters.push({ field: field as string, op: '>', value })
          return builder
        },
        whereLt(field, value) {
          filters.push({ field: field as string, op: '<', value })
          return builder
        },
        limit: (n) => {
          // Store limit for later
          const origExec = builder.exec
          builder.exec = async () => {
            const rows = await origExec()
            return rows.slice(0, n)
          }
          return builder
        },
        offset: (n) => {
          const origExec = builder.exec
          builder.exec = async () => {
            const rows = await origExec()
            return rows.slice(n)
          }
          return builder
        },
        orderBy: (field, direction = 'asc') => {
          const origExec = builder.exec
          builder.exec = async () => {
            const rows = await origExec()
            return rows.sort((a, b) => {
              const av = a[field] as number | string
              const bv = b[field] as number | string
              return direction === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
            })
          }
          return builder
        },
        select: (...fields) => {
          const origExec = builder.exec
          builder.exec = async () => {
            const rows = await origExec()
            return rows.map((r) => {
              const obj: Record<string, unknown> = {}
              for (const f of fields) obj[f as string] = r[f as string]
              return obj as SchemaToType<S>
            })
          }
          return builder as unknown as QueryBuilder<Pick<SchemaToType<S>, (typeof fields)[number]>>
        },
        exec: async () => {
          const rows = applyFilters([], filters)
          return rows.map((r) => schema.Decode(r as never) as SchemaToType<S>)
        },
        first: async () => {
          const rows = await builder.exec()
          return rows[0] ?? null
        },
        count: async () => {
          return globalStore.count(tableName, where as Record<string, unknown>)
        },
      }

      return builder
    },

    async create(data) {
      const row = globalStore.insert(tableName, data as Record<string, unknown>)
      return schema.Decode(row as never) as SchemaToType<S>
    },

    async createMany(data) {
      return Promise.all(data.map((d) => this.create(d)))
    },

    async update(id, data) {
      const row = globalStore.update(tableName, id, data as Record<string, unknown>, pk)
      return row ? (schema.Decode(row as never) as SchemaToType<S>) : null
    },

    async delete(id) {
      return globalStore.delete(tableName, id, pk)
    },

    async deleteMany(where) {
      return globalStore.deleteWhere(tableName, where as Record<string, unknown>, pk)
    },

    async count(where) {
      return globalStore.count(tableName, where as Record<string, unknown>)
    },

    async raw(sql, ...args) {
      // For in-memory store, this is a no-op
      // Real DB adapters would implement this
      console.warn('raw() not supported with in-memory store')
      return []
    },
  }
}
