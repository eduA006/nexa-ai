# Base de datos — NEXA AI

Proyecto Supabase: `khpqeqiimsqqwhyphuon` (cuenta del usuario, plan Free).

Migraciones en `supabase/migrations/`, aplicadas en orden cronológico por nombre de archivo.

## Tablas

### `public.profiles`

Un perfil por usuario autenticado, creado automáticamente al registrarse.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | único, FK a `auth.users(id)`, `on delete cascade` |
| `full_name` | `text` | nullable; el usuario lo completa desde `/profile` |
| `email` | `text` | not null |
| `avatar_url` | `text` | nullable |
| `role` | `text` | `'student'` \| `'professional'` \| `null` (se define en el onboarding, Fase 3) |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, actualizado por trigger en cada `UPDATE` |

**RLS**: habilitado. Políticas `profiles_select_own`, `profiles_update_own`, `profiles_insert_own` — todas restringidas a `auth.uid() = user_id`. Ningún usuario puede leer o modificar el perfil de otro.

**Triggers**:
- `on_auth_user_created` (en `auth.users`, `after insert`) → ejecuta `handle_new_user()`, que inserta la fila en `profiles` con los datos disponibles (`email`, y `full_name`/`avatar_url` si el proveedor los entrega). `SECURITY DEFINER`, con `EXECUTE` revocado a `public`/`anon`/`authenticated` para que solo pueda dispararse vía el trigger.
- `profiles_set_updated_at` (en `profiles`, `before update`) → actualiza `updated_at`.

### `public.documents`

Un archivo subido por el usuario. El archivo en sí vive en Supabase Storage (bucket `documents`); esta tabla guarda sus metadatos.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | FK a `auth.users(id)`, `on delete cascade` |
| `name` | `text` | nombre mostrado (por ahora, igual al nombre original) |
| `original_filename` | `text` | nombre del archivo tal como se subió |
| `file_type` | `text` | `pdf` \| `docx` \| `xlsx` \| `csv`, detectado por firma de bytes, no por el MIME declarado por el navegador |
| `storage_path` | `text` | único; ruta dentro del bucket, formato `<user_id>/<uuid>-<nombre>` |
| `processed_storage_path` | `text` | nullable; se usará cuando exista una versión procesada del documento (Fase 7+) |
| `status` | `text` | `'uploaded'` \| `'processing'` \| `'processed'` \| `'error'` |
| `created_at` / `updated_at` | `timestamptz` | `updated_at` actualizado por el mismo trigger `set_updated_at()` reutilizado de `profiles` |

**RLS**: habilitado. Políticas `documents_select_own`, `documents_insert_own`, `documents_update_own`, `documents_delete_own`, todas restringidas a `auth.uid() = user_id`.

**Storage**: bucket `documents` (privado, `public = false`). Políticas RLS en `storage.objects` (`documents_storage_select_own`, `_insert_own`, `_delete_own`) restringen el acceso a objetos cuya carpeta raíz coincide con el `user_id` del usuario autenticado (`storage.foldername(name))[1] = auth.uid()::text`). La descarga se hace con URLs firmadas de corta duración (60s), nunca URLs públicas.

**Límites aplicados en la subida** (`lib/documents/actions.ts`, usando `lib/config/limits.ts`):
- `MAX_FILE_SIZE_MB` por archivo.
- `MAX_DOCUMENTS_PER_DAY` por usuario (conteo de filas creadas desde el inicio del día UTC).
- Solo se aceptan PDF, DOCX, XLSX, CSV, validados por extensión **y** por firma de bytes del contenido real (no se confía en la extensión ni en el MIME type del cliente).

### `public.ai_sessions`

Registro de cada llamada a un proveedor de IA. Se usa para el límite diario (`MAX_AI_REQUESTS_PER_DAY`) y como base del historial (Fase 12).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK a `auth.users(id)`, `on delete cascade` |
| `tool` | `text` | ej. `'apa'` |
| `input` | `text` | nullable; referencia legible del input (ej. nombre del documento) |
| `result` | `jsonb` | nullable; resumen del resultado |
| `provider` | `text` | `'gemini'` \| `'groq'` |
| `model` | `text` | modelo real usado en esa llamada |
| `tokens_used` | `integer` | nullable |
| `created_at` | `timestamptz` | default `now()` |

**RLS**: habilitado. `ai_sessions_select_own`, `ai_sessions_insert_own`, restringidas a `auth.uid() = user_id`.

### `public.document_analyses`

Resultado persistido de analizar un documento con una herramienta (ej. diagnóstico APA).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `document_id` | `uuid` | FK a `documents(id)`, `on delete cascade` |
| `user_id` | `uuid` | FK a `auth.users(id)`, `on delete cascade` — se añadió además de `document_id` para que la política RLS sea directa (`auth.uid() = user_id`), igual que el resto de tablas |
| `analysis_type` | `text` | ej. `'apa'` |
| `result` | `jsonb` | hallazgos + resumen, forma específica de cada herramienta |
| `score` | `integer` | nullable; heurística 0-100, no una certificación de cumplimiento |
| `created_at` | `timestamptz` | default `now()` |

**RLS**: habilitado. `document_analyses_select_own`, `document_analyses_insert_own`, restringidas a `auth.uid() = user_id`.

## Próximas tablas

`tool_usage`, `settings` — se crean cuando sus fases correspondientes lo requieran, con RLS desde su primera migración. Ver `PLAN.md` sección 5 para el diseño conceptual.
