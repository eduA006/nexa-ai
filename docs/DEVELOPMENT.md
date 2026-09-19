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

## Flujo de trabajo por fase

Cada fase del `PLAN.md` se cierra únicamente después de:

1. `npm run lint`
2. Typecheck (`npx tsc --noEmit`)
3. `npm run build`
4. Corrección de cualquier error crítico
5. Documentación de la fase
6. Actualización de `PLAN.md`

No se avanza a la siguiente fase si la fase actual tiene errores críticos pendientes.
