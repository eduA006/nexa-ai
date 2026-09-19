# Costos — NEXA AI

El objetivo es que el proyecto pueda desarrollarse y probarse inicialmente con costo **S/0**. Esto no significa que el sistema sea gratuito de forma ilimitada: cada servicio usado tiene un free tier con límites, documentados aquí a medida que se integran.

## Servicios planeados y sus free tiers

| Servicio | Uso | Free tier (referencial, sujeto a cambios del proveedor) |
|---|---|---|
| Vercel | Hosting del frontend/backend Next.js | Plan Hobby gratuito, con límites de ancho de banda y ejecuciones por mes |
| Supabase | Base de datos, Auth, Storage | Plan Free: proyecto con límites de almacenamiento en base de datos, 1GB de Storage, pausas por inactividad |
| Google Cloud (OAuth) | Login con Google | Gratuito para autenticación OAuth estándar |
| Gemini API | Proveedor de IA principal | Free tier con límites de solicitudes por minuto/día (se documentan valores exactos al integrarse en Fase 5) |
| Groq API | Proveedor de IA de respaldo | Free tier con límites de solicitudes (se documentan valores exactos al integrarse en Fase 5) |

## Control de costos dentro de la aplicación

- `lib/config/limits.ts` centraliza `MAX_AI_REQUESTS_PER_DAY`, `MAX_DOCUMENTS_PER_DAY` y `MAX_FILE_SIZE_MB` para evitar que un usuario agote las cuotas gratuitas de los proveedores.
- La arquitectura híbrida (reglas programadas + IA) reduce las llamadas a proveedores de IA a lo estrictamente necesario.

## Advertencia

Los free tiers de Supabase, Vercel, Gemini y Groq pueden cambiar sus condiciones o límites en cualquier momento. Este documento se actualizará cuando eso ocurra, pero no debe interpretarse como una garantía de gratuidad permanente.
