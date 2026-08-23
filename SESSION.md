# Estado del proyecto — Framework contract-first en TypeScript

> Documento de sesión guardada. Retomar desde aquí en una nueva sesión.
> Última actualización: 22 de agosto de 2026.

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
├── package.json              # @contractfw/spike — deps instaladas
├── tsconfig.json             # ES2022, NodeNext, strict
├── scripts/
│   └── gen-fixtures.mjs      # generador de fixtures de escala (node scripts/gen-fixtures.mjs <N>)
├── src/
│   ├── index.ts              # exports públicos
│   ├── contract.ts           # NÚCLEO: contract(), HandlerInput, ResponseOf, RouteImpl, impl(), HttpError
│   ├── router.ts             # compilePath (con cache) + matchPath
│   ├── schema.ts             # re-export TypeBox + registro de formats (email, uuid, date-time...)
│   ├── server.ts             # createApp(routes): App con fetch(req); validación Value.Check
│   ├── client.ts             # client() Proxy + CallerFn/ClientOf/CallerResult
│   ├── openapi.ts            # generateOpenApi() → OpenAPI 3.1 (:id → {id})
│   └── node.ts               # listen(app, port) adaptador Node mínimo (node:http)
├── test/
│   └── core.test.ts          # 12 tests: runtime + e2e cliente + asserts expectTypeOf
└── bench/
    ├── tsconfig.ours.json
    ├── tsconfig.hono.json
    └── src/{ours,hono}.fixture.ts   # auto-generados (regenerables con gen-fixtures.mjs)
```

**Estado: 12/12 tests verdes · `tsc --noEmit` limpio.**

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

---

## 6. Pendientes para la próxima sesión

### A. Empaquetar el spike como repo público (manifiesto) — ✅ HECHO
- [x] `git init` + primer commit (`01639cc`, rama main).
- [x] README en inglés con: tesis, tabla de benchmarks, hallazgos cualitativos, ejemplo mínimo.
- [x] Nombre elegido: **tzin** (disponible en npm, verificado 404 en registry). Package renombrado a `tzin@0.1.0`.
- [ ] Antes de publicar: decidir licencia (README dice "MIT (pending)"), revisar si SESSION.md debe salir del repo público, crear repo remoto en GitHub.

### B. Runtime real — EN CURSO
- [x] Middleware onion-style (`compose`) + contexto tipado por request (`defineContext`/`Ctx` con `get`/`require`/`set`). `HandlerInput` ahora incluye `ctx`; el cliente usa `SectionsOf<C>` (sin ctx). Tests: orden cebolla, corto-circuito 401, compartir contexto tipado, require faltante→500, doble next()→500. 17 tests.
- [x] Adaptadores: `toWorker()` para Cloudflare Workers; `serveBun()` escrito según API documentada (**sin verificar** — no hay bun en el entorno). Node existente.
- [x] Streaming: `sse(producer)` → RawResult con ReadableStream (`event`/`comment`), y escape hatch general `raw(response)` en la unión de retorno del handler. Test e2e de eventos vía app.fetch. 18 tests.

### C. Roadmap estratégico (de la investigación) — EN CURSO
- [x] DI ligera: `provide(key, value)` a nivel app siembra singletons en el Ctx de cada request; handlers leen con `ctx.require(key)` tipado. Middleware puede sobreescribir (request scope gana). 20 tests.
- [ ] Toolchain AI-native: MCP server que exponga contratos a agentes + `llms.txt`.
- [ ] Segundo acto: realtime/presence nativo (Channels + Presence estilo Phoenix).

---

## 7. Entorno
- Node v24.15.0, npm 11.12.1 (**no hay pnpm**).
- Proyecto: `/home/carlos/Documentos/projects/framework` (aún sin git).
