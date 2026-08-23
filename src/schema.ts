import { Type as TbType, FormatRegistry } from '@sinclair/typebox'
import { Value as TbValue } from '@sinclair/typebox/value'

export const t = TbType
export const Value = TbValue

/* Sensible default formats. Users can extend via FormatRegistry. */
const formats: Record<string, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  uri: /^https?:\/\/[^\s]+$/,
  ipv4: /^(?:\d{1,3}\.){3}\d{1,3}$/,
}

for (const [name, pattern] of Object.entries(formats)) {
  if (!FormatRegistry.Has(name)) FormatRegistry.Set(name, (value: string) => pattern.test(value))
}

export type { Static, TSchema } from '@sinclair/typebox'
