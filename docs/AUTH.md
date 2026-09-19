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
- `app/auth/confirm/route.ts` — verifica el enlace de confirmación de correo (`supabase.auth.verifyOtp`).
- `app/auth/error/page.tsx` — página de error cuando un enlace de confirmación falla o expiró.
- `app/login`, `app/signup`, `app/signup/revisa-tu-correo` — páginas de auth.

## Flujo

1. Usuario se registra en `/signup` → `signup()` llama a `supabase.auth.signUp()`.
2. Supabase envía un correo de confirmación. Usuario ve `/signup/revisa-tu-correo`.
3. Usuario abre el enlace del correo → `app/auth/confirm/route.ts` verifica el `token_hash` y crea la sesión → redirige a `/dashboard`.
4. En logins posteriores, `/login` → `login()` llama a `supabase.auth.signInWithPassword()`.
5. `signOut()` cierra la sesión y redirige a `/`.

## Rutas protegidas

Definidas en `PROTECTED_PREFIXES` dentro de `lib/supabase/middleware.ts`:
`/dashboard`, `/documents`, `/tools`, `/history`, `/settings`, `/profile`, `/onboarding`.

Un usuario sin sesión que intente acceder a estas rutas es redirigido a `/login?redirectTo=<ruta original>`.

## Configuración requerida en el dashboard de Supabase

A diferencia de OAuth, email + contraseña **no requiere ninguna consola externa**. Solo hay que verificar/ajustar una cosa en el dashboard de Supabase (proyecto `khpqeqiimsqqwhyphuon`):

1. **Authentication → Email Templates → Confirm signup**: cambiar el enlace del template para que apunte a la ruta de confirmación de la app en vez del endpoint genérico de Supabase:

   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

2. **Authentication → URL Configuration → Site URL**: en desarrollo, `http://localhost:3000`. Se actualiza al dominio real en la Fase 15 (deploy).

Sin el paso 1, el enlace de confirmación no pasará por `app/auth/confirm/route.ts` y el usuario no podrá iniciar sesión tras registrarse.

## Tabla `profiles`

Cada usuario autenticado obtiene automáticamente una fila en `public.profiles` mediante el trigger `on_auth_user_created` (ver migración `create_profiles`). RLS garantiza que cada usuario solo puede leer/modificar su propia fila (`auth.uid() = user_id`).

Con email + contraseña, `full_name` y `avatar_url` quedan `null` hasta que el usuario los complete (Fase 3 / configuración). El campo `role` (`student` | `professional`) se completa en el onboarding (Fase 3).
