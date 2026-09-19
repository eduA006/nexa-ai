# PLAN.md — NEXA AI

> Plataforma inteligente para estudiar, crear y trabajar.
> Este documento es la fuente de verdad del progreso del proyecto. Se actualiza al cerrar cada fase.

## 0. Estado del proyecto

- Auditoría inicial: directorio vacío, sin código previo que reutilizar.
- Repositorio git: se inicializa localmente en esta fase (sin remoto de GitHub aún — se añadirá cuando el usuario provea uno o pida crearlo).

## 1. Arquitectura propuesta

### 1.1 Stack

| Capa | Elección | Motivo |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | SSR/RSC, API routes integradas, deploy directo a Vercel free tier |
| Estilos | Tailwind CSS + shadcn/ui + lucide-react | Componentes accesibles, sin licencia, alto control visual |
| Auth | Supabase Auth (Google OAuth) | Free tier suficiente, integra con Postgres + RLS |
| Base de datos | Supabase PostgreSQL | Free tier, RLS nativo |
| Storage | Supabase Storage | Free tier (1GB), integrado con Auth/RLS |
| IA primaria | Gemini API (free tier) | Buen free tier, multimodal, soporta JSON estructurado |
| IA secundaria/fallback | Groq (free tier, modelos OSS) | Rápido, gratuito, útil como fallback si Gemini falla o se agota cuota |
| DOCX | `docx` (generación) + `mammoth` (lectura) | Librerías maduras, sin costo |
| PDF | `pdf-lib` (manipulación) + `pdfjs-dist` (extracción texto) | Cobertura lectura+escritura |
| Excel/CSV | `xlsx` (SheetJS) | Estándar de facto |
| Deploy | Vercel (free tier) | Integración nativa Next.js |

### 1.2 Regla de arquitectura híbrida (reglas + IA)

Cada "analizador" (ej. APA) se divide en:
- **Motor de reglas** (`/lib/rules/*`): validaciones deterministas (márgenes, fuente, interlineado, estructura, patrones de referencia vía regex/heurísticas). No consume tokens de IA.
- **Motor de IA** (`/lib/ai/*`): evaluación de redacción, coherencia, cohesión, recomendaciones contextuales. Solo recibe el texto/metadatos estrictamente necesarios.
- Los resultados de ambos motores se combinan en un **`AnalysisResult`** tipado común antes de mostrarse en UI.

### 1.3 Capa de abstracción de IA (`/lib/ai/`)

```
lib/ai/
  provider.ts       // interfaz AIProvider (generate, generateStructured, embed?)
  gemini.ts         // implementación GeminiProvider
  groq.ts           // implementación GroqProvider (fallback)
  service.ts         // AIService: selecciona provider, maneja fallback y logging
  prompts/
    apa.ts
    writing.ts
    academic.ts
    professional.ts
    document-chat.ts
    ...
```

`AIService` es el único punto de entrada usado por los módulos de negocio (server actions / route handlers). Nunca se importa `GeminiProvider`/`GroqProvider` directamente fuera de esta capa. Cambiar de proveedor principal = cambiar una config, no código de negocio.

### 1.4 Procesamiento de documentos (`/lib/documents/`)

Separado en fases explícitas por módulo:
```
lib/documents/
  extract/     // DOCX/PDF/XLSX -> texto/estructura plana
  analyze/     // reglas programadas + orquestación IA
  generate/    // generación de DOCX/PDF de salida
```

### 1.5 Estructura de carpetas (Next.js App Router)

```
/app
  /(marketing)/page.tsx            -> landing "/"
  /login/page.tsx
  /onboarding/page.tsx
  /(app)/dashboard/page.tsx
  /(app)/documents/page.tsx
  /(app)/tools/page.tsx
  /(app)/tools/[slug]/page.tsx
  /(app)/history/page.tsx
  /(app)/settings/page.tsx
  /(app)/profile/page.tsx
  /api/...                         -> route handlers (uploads, ai, webhooks si aplica)
/components
  /ui                              -> shadcn primitives
  /shared                          -> componentes compartidos (cards, empty-states, etc.)
  /dashboard, /documents, /tools   -> componentes por dominio
/lib
  /ai
  /documents
  /rules
  /supabase                        -> clients server/browser, middleware helpers
  /config                          -> límites centralizados (MAX_AI_REQUESTS_PER_DAY, etc.)
  /types
/supabase
  /migrations
/docs
  ARCHITECTURE.md, DATABASE.md, AUTH.md, AI.md, FILE_PROCESSING.md, SECURITY.md, COSTS.md, DEVELOPMENT.md
```

### 1.6 Configuración centralizada de límites

`/lib/config/limits.ts` exporta constantes tipadas (`MAX_AI_REQUESTS_PER_DAY`, `MAX_DOCUMENTS_PER_DAY`, `MAX_FILE_SIZE_MB`), leídas desde env vars con defaults seguros. Ningún módulo hardcodea estos valores.

### 1.7 Variables de entorno (definidas, no inventadas)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        # solo servidor, nunca en cliente
GEMINI_API_KEY                   # solo servidor
GROQ_API_KEY                     # solo servidor
MAX_AI_REQUESTS_PER_DAY
MAX_DOCUMENTS_PER_DAY
MAX_FILE_SIZE_MB
```
Se documentan en `.env.example` cuando se cree en Fase 1/2.

## 2. Fases de desarrollo

- [ ] **Fase 1** — Base del proyecto + UI + arquitectura (Next.js, TS, Tailwind, shadcn, estructura de carpetas, landing estática, .env.example, docs base)
- [ ] **Fase 2** — Supabase + Google Auth (cliente Supabase, middleware, login/logout, protección de rutas)
- [ ] **Fase 3** — Profiles + onboarding + dashboard (esquema `profiles`, selección estudiante/profesional, dashboard base)
- [ ] **Fase 4** — Sistema de documentos + Storage (tabla `documents`, subida, validación MIME/tamaño, listado)
- [ ] **Fase 5** — Capa de IA (`AIProvider`, `GeminiProvider`, `GroqProvider`, `AIService`, prompts base)
- [ ] **Fase 6** — Corrector APA (reglas programadas + IA, diagnóstico UI)
- [ ] **Fase 7** — Generación DOCX corregido
- [ ] **Fase 8** — Analizador de escritura / indicadores de IA
- [ ] **Fase 9** — Chat con documentos
- [ ] **Fase 10** — Resto de herramientas de estudiante
- [ ] **Fase 11** — Herramientas profesionales
- [ ] **Fase 12** — Historial + límites + estadísticas de uso
- [ ] **Fase 13** — Seguridad + pruebas
- [ ] **Fase 14** — Optimización
- [ ] **Fase 15** — Deploy (Vercel)

Cada fase se cierra solo tras: lint + typecheck + build sin errores críticos, documentación de la fase, y actualización de este archivo.

## 3. Decisiones tomadas sin consultar (documentadas)

- Se usa `mammoth` para lectura de DOCX (extracción a texto/HTML) por ser la opción gratuita más madura; `docx` para generación.
- Se usa `pdfjs-dist` para extracción de texto de PDF y `pdf-lib` para manipulación/generación, ya que cubren necesidades distintas y ambas son gratuitas.
- Row Level Security se implementará desde la primera migración que cree tablas con `user_id`, no se pospone.
- No se crea remoto de GitHub automáticamente; se inicializa git local. Se preguntará antes de crear/push a un repositorio remoto.

## 4. Próximo paso inmediato

Ejecutar Fase 1: scaffolding de Next.js + TypeScript + Tailwind + shadcn/ui, estructura de carpetas definida arriba, landing estática mínima, `.env.example`, y documentación base en `/docs`.
