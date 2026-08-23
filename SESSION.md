# Estado del proyecto — Framework contract-first en TypeScript

> Documento de sesión guardada. Retomar desde aquí en una nueva sesión.
> Última actualización: 23 de agosto de 2026. Roadmap del spike COMPLETO.

---

## 1. Objetivo y tesis

Crear un framework web backend **open-source en TypeScript** diferenciado por huecos reales del mercado.

**Tesis validada por investigación y spike:**

> Framework contract-first en TypeScript con extractors estilo Axum, tipos que escalan sin explosión
> de inferencia, OpenAPI gratis vía TypeBox (JSON Schema nativo) y toolchain AI-native.
> Realtime/presence como segundo acto (lo que Phoenix tiene y nadie tiene en TS).

### Contexto de mercado (investigación previa)
- **Panorama 2026**: Express legacy · Fastify producción Node · Hono estándar de facto (9.3M descargas/semana) · Elysia Bun/perf · NestJS enterprise/DI · Adonis baterías incluidas pre-modernas.
- **Huecos validados**:
  - Colapso de inferencia de tipos a escala en Hono (issues #2399, #3869; CI de 8 min).
  - Falta de arquitectura/DI en frameworks ligeros (issue Hono #4121).
  - Extractors ausentes en TS (solo Rust/Axum los tiene bien hechos).
  - Realtime/Presence nativo solo existe en Phoenix (Channels + Presence CRDT + PubSub).
  - Ventana AI-native abierta pero cerrándose (Encore es el único con MCP oficial).
- **Lenguajes alternativos descartados**: Go (cultura anti-framework, Buffalo murió), Rust (compile times + cultura à-la-carte), Python (Litestar ya ejecuta ese nicho). TS queda como elección óptima.

---

## 2. Decisiones de diseño

| Decisión | Elección | Razón |
|---|---|---|
| Definición de rutas | Contratos = objetos planos (`contract()` identidad con `const` generics) | Registro plano → inferencia O(1) por endpoint, sin chaining |
| Schemas | TypeBox `@sinclair/typebox` ^0.34 | ES JSON Schema → OpenAPI 3.1 sin capa de conversión |
| Runtime | Web Standards (`Request`/`Response`) | App puro `fetch(req)` testeable sin servidor; portable a Node/Bun/workers |
| Input del handler | Estilo extractor: `HandlerInput<C>` intersección condicional | Solo secciones declaradas (params/query/body); nada implícito |
| Respuesta | Unión discriminada `ResponseOf<C>` sobre statuses declarados | El compilador exige cubrir cada status declarado |
| Errores | `throw new HttpError(status, msg)` | Mapeado a respuesta tipada automáticamente |
| Cliente tipado | `ClientOf<Routes>` mapped type plano + Proxy en runtime | Una llamada = request real con tipos end-to-end |
| Path syntax interna | `:id` interno, `{id}` para OpenAPI | — |

---

## 3. Estructura actual

```
/home/carlos/Documentos/projects/framework
├── package.json              # tzin@0.1.0 (private)
├── README.md                 # manifiesto en inglés: tesis, benchmarks, ejemplos
├── SESSION.md                # este documento
├── tsconfig.json             # ES2022, NodeNext, strict
├── scripts/
│   └── gen-fixtures.mjs      # generador de fixtures de escala (node scripts/gen-fixtures.mjs <N>)
├── src/
│   ├── index.ts              # exports públicos
│   ├── contract.ts           # NÚCLEO: contract(), SectionsOf/HandlerInput, ResponseOf, impl(), HttpError, raw()
│   ├── router.ts             # compilePath (con cache) + matchPath
│   ├── schema.ts             # re-export TypeBox + registro de formats (email, uuid, date-time...)
│   ├── server.ts             # createApp(routes, { middleware?, provides? }): validación + DI seed + raw passthrough
│   ├── client.ts             # client() Proxy + CallerFn/ClientOf/CallerResult
│   ├── openapi.ts            # generateOpenApi() → OpenAPI 3.1 (:id → {id}, usa name/description)
│   ├── node.ts               # listen(app, port) adaptador Node (node:http)
│   ├── bun.ts                # serveBun() — API documentada, SIN verificar en runtime
│   ├── workers.ts            # toWorker() para Cloudflare Workers
│   ├── context.ts            # defineContext<T>() + Ctx (get/require/set, signal, seed)
│   ├── middleware.ts         # compose() onion + tipo Middleware
│   ├── provide.ts            # provide(key, value) con check de marca tipada
│   ├── sse.ts                # sse(producer, signal?) → RawResult; cierra en finish o abort
│   ├── mcp.ts                # handleMcpMessage/listTools/toTool (JSON-RPC MCP)
│   ├── mcp_stdio.ts          # startStdioMcp() transporte NDJSON por stdio
│   ├── hub.ts                # Hub pub/sub en memoria
│   ├── presence.ts           # Presence TTL estilo Phoenix (state/diff/sweep)
│   └── channels.ts           # channelRoutes(hub, { presence }) montables
├── test/
│   └── core.test.ts          # 28 tests: núcleo + middleware + DI + SSE + MCP + realtime
└── bench/
    ├── tsconfig.ours.json
    ├── tsconfig.hono.json
    └── src/{ours,hono}.fixture.ts   # auto-generados (regenerables con gen-fixtures.mjs)
```

**Estado: 28/28 tests verdes · `tsc --noEmit` limpio · 7 commits en main.**

Comandos: `npm test`, `npm run typecheck`, benchmarks: `npx tsc -p bench/tsconfig.{ours,hono}.json --extendedDiagnostics`.

---

## 4. Resultados del benchmark de escala

| N rutas | Ours: tipos | Hono: tipos | Ours: instanciaciones | Hono: instanciaciones | Check ours / hono |
|---|---|---|---|---|---|
| 20 | 4.851 | 72.368 | 22.472 | 156.054 | 0.25s / 0.31s |
| 100 | 15.779 | 111.952 | 93.128 | 239.998 | 0.53s / 0.55s |
| 300 | 43.099 | 210.912 | 269.768 | 589.858 | 1.13s / 1.34s |

- Crecimiento **estrictamente lineal** en nuestro modelo (~130 tipos/endpoint).
- Hono arranca con ~72k tipos de base (superficie lib+hc) y ~2.5x más instanciaciones por endpoint.
- Nota honesta: fixture de Hono sin `zValidator`; el colapso real (#2399/#3869) aparece al encadenar validadores. Aun así nuestra superficie es ~5x menor ya desde N=20.

### Hallazgos cualitativos (material para README/manifiesto)
1. **El patrón encadenado obliga a una sola expresión gigante**: si las rutas se escriben como statements separados (`app.get(...)` línea a línea), `typeof app` pierde TODAS las rutas — los tipos solo fluyen por la cadena. Con 100 rutas eso es un archivo ilegible.
2. Registrar la misma ruta dos veces **degrada el tipado del cliente silenciosamente** (`hc<AppType>` → índices inexistentes).
3. Nuestro modelo no sufre ninguno de los dos problemas por diseño (registro plano).

---

## 5. Bugs encontrados y corregidos (lecciones técnicas)

1. **`ResponseOf` resolvía a `never`**: con `const` generics las claves numéricas de objeto se preservan como literales numéricos (`404 | 200`), NO como strings. La intersección `` keyof & `${number}` `` sobre números da `never`. Fix: mapear sobre todas las claves y convertir `K extends number ? K : K extends \`${infer N extends number}\` ? N : never`.
2. **`FormatRegistry`** vive en el módulo raíz `'@sinclair/typebox'`, NO en `'@sinclair/typebox/value'` ni en subpath `/format` (ERR_PACKAGE_PATH_NOT_EXPORTED).
3. **`Value` debe importarse como export nombrado** desde `'@sinclair/typebox/value'` (no namespace del módulo entero).
4. TypeBox 0.34 **exige registrar formats** antes de validar ("Unknown format 'email'") → hecho en `schema.ts`.
5. Varianza: arrays heterogéneos de `RouteImpl<C>` requieren firma `RouteImpl<any>[]` en `createApp`/`generateOpenApi`.
6. vitest `toEqualTypeOf` es quisquitoso con uniones + props opcionales/unknown → estrechar la unión con `'error' in data` antes de asertar.
7. **`HandlerInput` solo expone secciones DECLARADAS**: un contrato con `:topic` en el path pero sin `params:` declarado NO recibe params (ni en runtime ni en tipos) — el server solo valida/puebla lo que el contrato anuncia.
8. **`sse()` cierra el stream cuando el productor termina**: para streams infinitos (canales), el productor debe esperar el abort (`await new Promise(resolve => signal.addEventListener('abort', ...))`).
9. vitest `toHaveBeenCalledTimes` exige un spy (`vi.fn()`), no funciones planas.
10. Slugs de nombres de tools: normalizar con `/[^A-Za-z0-9]+/g → '_'` (runs consecutivos colapsan a un solo `_`).
11. **Los clientes MCP envían argumentos planos** (`{id:'1'}`), no anidados por sección (`{params:{id:'1'}}`). `callTool` acepta ambas formas resolviendo contra las propiedades declaradas de cada sección; params faltantes → error claro (`Missing argument(s): params.id`) en vez de placeholder silencioso.

### Validación externa — ✅ MCP verificado con clientes reales (23 ago 2026)
- Probe propio (`npm run probe:mcp`, `scripts/mcp-client.mjs`): 9/9 checks — handshake, discovery, JSON Schema real, dispatch in-process, query, 404→isError, args planos, missing param, unknown tool.
- **Inspector oficial** (`npx @modelcontextprotocol/inspector --cli`): tools/list ✓, tools/call con path params planos ✓, query plana ✓, 404→isError ✓.
- Demo ejecutable: `examples/mcp-demo.ts` (`npx tsx examples/mcp-demo.ts`).

---

## 6. Estado del roadmap y próximos pasos

### Roadmap del spike — ✅ COMPLETO (ver secciones anteriores)
- [x] A. Empaquetado: nombre **tzin**, README-manifiesto, git.
- [x] B. Runtime: middleware onion + contexto tipado, adaptadores Node/Workers/Bun, SSE + raw().
- [x] C. Estratégico: DI ligera, MCP server (stdio), realtime channels + presence.

### Pendientes para la próxima sesión (orden sugerido)

**Validación externa (alta prioridad)**
1. ~~Probar el MCP server con un cliente real~~ ✅ HECHO (ver sección "Validación externa").
2. Verificar `serveBun()` instalando Bun (`curl -fsSL https://bun.sh/install | bash`).
3. Publicar repo en GitHub + decidir licencia (README dice "MIT pending") + revisar si SESSION.md sale del repo público.

**Producto**
4. Transport HTTP/SSE para MCP además de stdio; `resources/list`.
5. WebSocket nativo por runtime (Node ws / Bun / Durable Objects) como alternativa a SSE+POST.
6. Hub multi-nodo: interfaz de adapter (Redis pub/sub, Cloudflare Durable Objects).
7. Cliente JS oficial para channels (`tzin/client-browser`: EventSource + heartbeat automático).

**Calidad antes de npm publish**
8. Cobertura de edge cases del router (rutas duplicadas, params colisionantes, 405 vs 404).
9. Benchmarks de runtime (req/s) además de los de tipos.
10. CI (GitHub Actions): test + typecheck + bench en cada push.

---

## 7. Entorno
- Node v24.15.0, npm 11.12.1 (**no hay pnpm**; tampoco bun instalado).
- Proyecto: `/home/carlos/Documentos/projects/framework` — repo git, rama main, 7 commits.
- Commits: `01639cc` inicial → `2f9e7b3` docs → `9ac7b26` middleware → `ec1f2e4` SSE/adaptadores → `f479be3` DI → `66c09c2` MCP → `004d2e9` realtime.
