# Autenticación — NEXA AI

Estado: Fase 2. Login con **email + contraseña** vía Supabase Auth.

## Decisión: email + contraseña en vez de Google OAuth

El plan original contemplaba login con Google. Se cambió a email + contraseña
porque crear el OAuth Client ID requiere que el usuario verifique una
tarjeta en Google Cloud Console, y el usuario prefirió evitarlo. Email +
contraseña es nativo de Supabase Auth, no requiere ninguna consola externa
ni verificación de pago, y mantiene el mismo nivel de seguridad (hashing,
confirmación de correo, RLS). Google (u otro proveedor OAuth como GitHub,
que no requiere tarjeta) puede añadirse más adelante sin cambiar el resto
de la arquitectura de auth, ya que toda la lógica de sesión pasa por
Supabase Auth de la misma forma.

## Arquitectura

- `lib/supabase/client.ts` — cliente de Supabase para Client Components.
- `lib/supabase/server.ts` — cliente de Supabase para Server Components, Server Actions y Route Handlers (usa `cookies()` async de Next.js 16).
- `lib/supabase/middleware.ts` + `proxy.ts` (raíz) — refresca la sesión en cada request y protege rutas. En Next.js 16, el archivo `middleware.ts` se renombró a `proxy.ts`; el comportamiento es idéntico.
- `lib/validations/auth.ts` — esquema Zod compartido para validar email/contraseña.
- `lib/supabase/actions.ts` — Server Actions `login`, `signup`, `signOut`.
- `app/auth/callback/route.ts` — destino del enlace de confirmación (`?code=...`), intercambia el código por una sesión (`exchangeCodeForSession`).
- `app/auth/error/page.tsx` — página de error cuando un enlace de confirmación falla o expiró.
- `app/login`, `app/signup`, `app/signup/revisa-tu-correo` — páginas de auth.

## Flujo

1. Usuario se registra en `/signup` → `signup()` llama a `supabase.auth.signUp()` con `emailRedirectTo: "<origin>/auth/callback"`.
2. Supabase envía el correo de confirmación **por defecto** (sin necesidad de SMTP propio ni de editar la plantilla). Usuario ve `/signup/revisa-tu-correo`.
3. Usuario abre `{{ .ConfirmationURL }}` del correo → Supabase verifica el token en su propio servidor y redirige a `emailRedirectTo` con `?code=...` → `app/auth/callback/route.ts` intercambia el código por una sesión (`exchangeCodeForSession`) → redirige a `/dashboard`.
4. En logins posteriores, `/login` → `login()` llama a `supabase.auth.signInWithPassword()`.
5. `signOut()` cierra la sesión y redirige a `/`.

**Por qué no se editó la plantilla de email**: Supabase Free requiere configurar un proveedor SMTP propio para poder editar el asunto/cuerpo de los correos (banner "Set up custom SMTP to edit templates" en el dashboard). Configurar SMTP es un paso adicional evitable: usando el `{{ .ConfirmationURL }}` por defecto junto con `emailRedirectTo` se logra el mismo resultado sin esa dependencia. Si en el futuro se configura SMTP propio (para personalizar branding del correo, por ejemplo), se puede volver al patrón `token_hash` + `verifyOtp` documentado por Supabase, pero no es necesario para que la autenticación funcione.

## Rutas protegidas

Definidas en `PROTECTED_PREFIXES` dentro de `lib/supabase/middleware.ts`:
`/dashboard`, `/documents`, `/tools`, `/history`, `/settings`, `/profile`, `/onboarding`.

Un usuario sin sesión que intente acceder a estas rutas es redirigido a `/login?redirectTo=<ruta original>`.

## Configuración requerida en el dashboard de Supabase

A diferencia de OAuth, email + contraseña **no requiere ninguna consola externa ni SMTP propio**. Solo hay que ajustar la lista de redirects permitidos en el dashboard de Supabase (proyecto `khpqeqiimsqqwhyphuon`):

1. **Authentication → URL Configuration → Site URL**: en desarrollo, `http://localhost:3000`. Se actualiza al dominio real en la Fase 15 (deploy).
2. **Authentication → URL Configuration → Redirect URLs**: agregar `http://localhost:3000/auth/callback` (y, cuando exista, la URL de producción equivalente).

Sin el paso 2, Supabase rechaza el `emailRedirectTo` enviado por `signUp()` y el enlace de confirmación no podrá redirigir de vuelta a la app.

## Tabla `profiles`

Cada usuario autenticado obtiene automáticamente una fila en `public.profiles` mediante el trigger `on_auth_user_created` (ver migración `create_profiles`). RLS garantiza que cada usuario solo puede leer/modificar su propia fila (`auth.uid() = user_id`).

Con email + contraseña, `full_name` y `avatar_url` quedan `null` hasta que el usuario los complete (Fase 3 / configuración). El campo `role` (`student` | `professional`) se completa en el onboarding (Fase 3).
