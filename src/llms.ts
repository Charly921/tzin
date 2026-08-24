import type { RouteImpl } from './contract.js'

export interface ApiMeta {
  title?: string
  description?: string
  version?: string
}

function endpointLines(routes: RouteImpl<any>[]): string[] {
  return routes.map(({ contract: c }) => {
    const name = c.name ?? c.path.replace(/[^A-Za-z0-9]+/g, '_')
    const label = `${c.method} ${c.path}`
    const desc = c.description ? `: ${c.description}` : ''
    return `- [\`${label}\`](${name})${desc}`
  })
}

/** llms.txt: the discoverable, human-readable index of the API. */
export function renderLlmsTxt(routes: RouteImpl<any>[], meta: ApiMeta = {}): string {
  const title = meta.title ?? 'API'
  const summary =
    meta.description ?? `${routes.length} typed endpoints over a shared contract layer.`
  return [
    `# ${title}`,
    '',
    `> ${summary}`,
    '',
    '## Endpoints',
    '',
    ...endpointLines(routes),
    '',
  ].join('\n')
}

/** llms-full.txt: same index plus each endpoint's declared JSON Schemas. */
export function renderLlmsFullTxt(routes: RouteImpl<any>[], meta: ApiMeta = {}): string {
  const head = renderLlmsTxt(routes, meta)
  const blocks = routes.map(({ contract: c }) => {
    const name = c.name ?? c.path.replace(/[^A-Za-z0-9]+/g, '_')
    const lines = [
      `### ${c.method} ${c.path} (${name})`,
      '',
      ...(c.description ? [`${c.description}`, ''] : []),
    ]
    for (const section of ['params', 'query', 'headers', 'cookies', 'body'] as const) {
      if (section in c && c[section]) {
        lines.push(`\`${section}\` schema:`, '', '```json', JSON.stringify(c[section]), '```', '')
      }
    }
    for (const [status, schema] of Object.entries(c.responses)) {
      lines.push(`response ${status} schema:`, '', '```json', JSON.stringify(schema), '```', '')
    }
    return lines.join('\n')
  })
  return `${head}\n## Endpoint details\n\n${blocks.join('\n')}`
}
