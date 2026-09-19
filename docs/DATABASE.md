# Base de datos — NEXA AI

Proyecto Supabase: `nexa-ai` (`tgdkomcqnoarcdhayztr`, región `us-east-1`, plan Free).

Migraciones en `supabase/migrations/`, aplicadas en orden cronológico por nombre de archivo.

## Tablas

### `public.profiles`

Un perfil por usuario autenticado, creado automáticamente al registrarse.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | único, FK a `auth.users(id)`, `on delete cascade` |
| `full_name` | `text` | nullable, tomado de metadata de Google en el signup |
| `email` | `text` | not null |
| `avatar_url` | `text` | nullable |
| `role` | `text` | `'student'` \| `'professional'` \| `null` (se define en el onboarding, Fase 3) |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, actualizado por trigger en cada `UPDATE` |

**RLS**: habilitado. Políticas `profiles_select_own`, `profiles_update_own`, `profiles_insert_own` — todas restringidas a `auth.uid() = user_id`. Ningún usuario puede leer o modificar el perfil de otro.

**Triggers**:
- `on_auth_user_created` (en `auth.users`, `after insert`) → ejecuta `handle_new_user()`, que inserta la fila en `profiles` con los datos disponibles del proveedor OAuth. `SECURITY DEFINER`, con `EXECUTE` revocado a `public`/`anon`/`authenticated` para que solo pueda dispararse vía el trigger.
- `profiles_set_updated_at` (en `profiles`, `before update`) → actualiza `updated_at`.

## Próximas tablas (Fases 4+)

`documents`, `ai_sessions`, `tool_usage`, `document_analyses`, `settings` — se crean cuando sus fases correspondientes lo requieran, con RLS desde su primera migración. Ver `PLAN.md` sección 5 para el diseño conceptual.
