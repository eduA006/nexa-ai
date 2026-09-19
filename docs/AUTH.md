# Autenticación — NEXA AI

Estado: Fase 2. Login con Google vía Supabase Auth.

## Arquitectura

- `lib/supabase/client.ts` — cliente de Supabase para Client Components.
- `lib/supabase/server.ts` — cliente de Supabase para Server Components, Server Actions y Route Handlers (usa `cookies()` async de Next.js 16).
- `lib/supabase/middleware.ts` + `proxy.ts` (raíz) — refresca la sesión en cada request y protege rutas. En Next.js 16, el archivo `middleware.ts` se renombró a `proxy.ts`; el comportamiento es idéntico.
- `lib/supabase/actions.ts` — Server Actions `signInWithGoogle` y `signOut`.
- `app/auth/callback/route.ts` — intercambia el código de OAuth por una sesión.

## Rutas protegidas

Definidas en `PROTECTED_PREFIXES` dentro de `lib/supabase/middleware.ts`:
`/dashboard`, `/documents`, `/tools`, `/history`, `/settings`, `/profile`, `/onboarding`.

Un usuario sin sesión que intente acceder a estas rutas es redirigido a `/login?redirectTo=<ruta original>`.

## Configuración requerida (fuera del código, en dashboards externos)

Esto **no se puede automatizar por seguridad** — requiere acceso directo del usuario a Google Cloud Console y al dashboard de Supabase.

### 1. Google Cloud Console

1. Crear (o reutilizar) un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Ir a **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
3. Tipo de aplicación: **Web application**.
4. **Authorized JavaScript origins**:
   - `http://localhost:3000` (desarrollo)
   - el dominio de producción cuando exista (Fase 15)
5. **Authorized redirect URIs**:
   - `https://tgdkomcqnoarcdhayztr.supabase.co/auth/v1/callback`
6. Guardar el **Client ID** y el **Client Secret**.

### 2. Supabase Dashboard

1. Ir al proyecto `nexa-ai` → **Authentication → Providers → Google**.
2. Activar el provider y pegar el Client ID y Client Secret del paso anterior.
3. Guardar.

Sin este paso, el botón "Continuar con Google" de `/login` iniciará el flujo pero Supabase rechazará la solicitud.

## Tabla `profiles`

Cada usuario autenticado obtiene automáticamente una fila en `public.profiles` mediante el trigger `on_auth_user_created` (ver migración `create_profiles`). RLS garantiza que cada usuario solo puede leer/modificar su propia fila (`auth.uid() = user_id`).

El campo `role` (`student` | `professional`) se completa en el onboarding (Fase 3); hasta entonces es `null`.
