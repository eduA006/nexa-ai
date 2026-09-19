# Arquitectura — NEXA AI

Estado: Fase 1 (base del proyecto). Este documento se amplía en cada fase.

## Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Estilos**: Tailwind CSS v4 + shadcn/ui + lucide-react
- **Auth**: Supabase Auth con Google OAuth (Fase 2)
- **Base de datos**: Supabase PostgreSQL con Row Level Security (Fase 3+)
- **Storage**: Supabase Storage (Fase 4)
- **IA**: capa de abstracción en `/lib/ai` con Gemini como proveedor principal y Groq como fallback (Fase 5)
- **Deploy**: Vercel

## Principio: reglas programadas + IA

Ningún analizador delega en IA lo que puede resolverse con reglas deterministas
(formato, estructura, patrones). La IA se reserva para tareas que requieren
comprensión de lenguaje natural: redacción, coherencia, recomendaciones
contextuales. Ver `PLAN.md` sección 1.2.

## Estructura de carpetas

```
/app            Rutas (App Router). Grupos: (marketing), (app)
/components/ui  Primitivos shadcn/ui
/components/*   Componentes por dominio
/lib/ai         Capa de abstracción de proveedores de IA
/lib/documents  Extracción, análisis y generación de documentos
/lib/rules      Motores de reglas deterministas
/lib/supabase   Clientes Supabase (server/browser)
/lib/config     Configuración centralizada (límites, etc.)
/lib/types      Tipos compartidos
/supabase/migrations  Migraciones SQL
/docs           Documentación del proyecto
```

## Decisiones de la Fase 1

- Next.js 16 (última versión estable al momento de crear el proyecto), React 19.
- shadcn/ui con estilo `base-nova` sobre `@base-ui/react` (versión actual de shadcn CLI).
- Sin backend propio fuera de Next.js: route handlers y server actions cubren las necesidades del servidor.

Ver `PLAN.md` para el detalle completo de fases y decisiones arquitectónicas.
