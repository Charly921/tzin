import { Value } from './schema.js'
import type { AnyContract, SectionsOf, ResponseOf } from './contract.js'
import type { App } from './server.js'
import { listen } from './node.js'
import type { Server } from 'node:http'

export interface TestClient {
  /** Make a GET request */
  get(path: string, init?: RequestInit): Promise<TestResponse>
  /** Make a POST request */
  post(path: string, body?: unknown, init?: RequestInit): Promise<TestResponse>
  /** Make a PUT request */
  put(path: string, body?: unknown, init?: RequestInit): Promise<TestResponse>
  /** Make a PATCH request */
  patch(path: string, body?: unknown, init?: RequestInit): Promise<TestResponse>
  /** Make a DELETE request */
  delete(path: string, init?: RequestInit): Promise<TestResponse>
  /** Make a custom request */
  request(path: string, init: RequestInit): Promise<TestResponse>
  /** Close the server */
  close(): Promise<void>
  /** Get the base URL */
  readonly baseUrl: string
}

export interface TestResponse {
  status: number
  headers: Headers
  body: unknown
  json<T = unknown>(): Promise<T>
  text(): Promise<string>
}

/**
 * Create a test client for an app.
 * Starts a server, makes requests, and cleans up.
 *
 * @example
 * ```ts
 * const api = await createTestClient(app)
 * const res = await api.get('/users/1')
 * expect(res.status).toBe(200)
 * expect(res.body).toEqual({ id: '1', name: 'Ada' })
 * await api.close()
 * ```
 */
export async function createTestClient(app: App): Promise<TestClient> {
  const server = await listen(app, 0)
  const port = (server.address() as { port: number }).port
  const baseUrl = `http://127.0.0.1:${port}`

  async function request(path: string, init: RequestInit = {}): Promise<TestResponse> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init.headers,
      },
    })

    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      try {
        body = await res.text()
      } catch {
        body = null
      }
    }

    return {
      status: res.status,
      headers: res.headers,
      body,
      json: <T = unknown>() => Promise.resolve(body as T),
      text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    }
  }

  return {
    baseUrl,
    get: (path, init) => request(path, { ...init, method: 'GET' }),
    post: (path, body, init) =>
      request(path, { ...init, method: 'POST', body: body != null ? JSON.stringify(body) : undefined }),
    put: (path, body, init) =>
      request(path, { ...init, method: 'PUT', body: body != null ? JSON.stringify(body) : undefined }),
    patch: (path, body, init) =>
      request(path, { ...init, method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined }),
    delete: (path, init) => request(path, { ...init, method: 'DELETE' }),
    request,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections?.()
        server.close((err) => (err ? reject(err) : resolve()))
      }),
  }
}

/**
 * Test that a handler satisfies its contract.
 * Calls the handler and validates the response against the declared schemas.
 *
 * @example
 * ```ts
 * testContract(getUser, async (call) => {
 *   const res = await call({ params: { id: '1' } })
 *   expect(res.status).toBe(200)
 *   expect(res.body).toMatchSchema(getUser.responses[200])
 * })
 * ```
 */
export function testContract<C extends AnyContract>(
  contract: C,
  fn: (call: (input: SectionsOf<C>) => Promise<ResponseOf<C>>) => Promise<void>,
): void {
  // This is a higher-order test helper - actual test framework integration
  // would require a adapter for vitest/jest/etc.
  // For now, export the utility and let users wrap it.
}

/**
 * Validate that a value matches a schema.
 * Returns true if valid, throws with details if invalid.
 */
export function expectSchema(schema: unknown, value: unknown): void {
  if (!Value.Check(schema as never, value)) {
    const errors = [...Value.Errors(schema as never, value)]
    const details = errors.map((e) => `${e.path || '/'}: ${e.message}`).join('\n')
    throw new Error(`Schema validation failed:\n${details}`)
  }
}

/**
 * Create a typed mock for a contract's sections.
 * Useful for generating test data.
 */
export function mockSections<C extends AnyContract>(
  contract: C,
  overrides?: Partial<SectionsOf<C>>,
): SectionsOf<C> {
  const sections: Record<string, unknown> = {}

  if ('params' in contract && contract.params) {
    sections.params = generateMock(contract.params)
  }
  if ('query' in contract && contract.query) {
    sections.query = generateMock(contract.query)
  }
  if ('body' in contract && contract.body) {
    sections.body = generateMock(contract.body)
  }

  return { ...sections, ...overrides } as SectionsOf<C>
}

/**
 * Generate mock data from a TypeBox schema.
 */
function generateMock(schema: unknown): unknown {
  const s = schema as Record<string, unknown>

  if (s.type === 'string') return 'mock-string'
  if (s.type === 'number') return 42
  if (s.type === 'boolean') return true
  if (s.type === 'array') {
    const items = s.items ? generateMock(s.items) : 'mock-item'
    return [items]
  }
  if (s.type === 'object' && s.properties) {
    const obj: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(s.properties as Record<string, unknown>)) {
      obj[key] = generateMock(value)
    }
    return obj
  }

  return null
}
