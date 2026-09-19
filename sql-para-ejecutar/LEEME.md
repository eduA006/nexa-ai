# Cómo ejecutar estos archivos

En tu proyecto Supabase, en el **SQL Editor** → **New query**, ejecuta los archivos **en orden numérico** (01, 02, 03, 04...), cada uno en su propia query:

1. `01_create_profiles.sql`
2. `02_restrict_handle_new_user_execute.sql`
3. `03_create_documents.sql`
4. `04_create_documents_storage.sql`

Después de cada uno, revisa que no haya errores antes de continuar con el siguiente.

Al final, ve a **Database → Advisors → Security** y confirma que no aparecen warnings.

Estos mismos archivos están versionados de forma permanente en `supabase/migrations/` (con nombre y formato de migración). Esta carpeta es solo una copia práctica para pegar y ejecutar manualmente; no forma parte de la estructura de código de la app.
