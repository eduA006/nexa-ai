# Desarrollo — NEXA AI

## Requisitos

- Node.js 20+
- npm

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar variables cuando existan (Fase 2+)
npm run dev
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm test` | Tests unitarios (Vitest) — lógica pura: reglas de análisis, formateo APA, validación de archivos, guard SSRF |

## Tests (Vitest, desde la Fase 13)

Cubren únicamente lógica 100% determinista y sin I/O real: `lib/rules/*`, `lib/citations/apa-reference.ts`, `lib/citations/lookup.ts` (guard de seguridad SSRF), `lib/documents/validate.ts`. Las herramientas que dependen de la IA real (Gemini/Groq) se siguen verificando manualmente end-to-end contra las APIs reales, como en el resto del proyecto — no se mockean las respuestas de IA en tests automatizados, ya que eso solo probaría el mock, no el comportamiento real del proveedor.

`vitest.config.mts` resuelve `server-only` a un stub (`test/stubs/server-only.ts`) porque ese paquete solo funciona dentro del bundler de Next.js.

## Flujo de trabajo por fase

Cada fase del `PLAN.md` se cierra únicamente después de:

1. `npm run lint`
2. Typecheck (`npx tsc --noEmit`)
3. `npm run build`
4. `npm test` (desde la Fase 13)
5. Corrección de cualquier error crítico
6. Documentación de la fase
7. Actualización de `PLAN.md`

No se avanza a la siguiente fase si la fase actual tiene errores críticos pendientes.
