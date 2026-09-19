# Cómo ejecutar estos archivos

En tu proyecto Supabase (el nuevo, `khpqeqiimsqqwhyphuon`):

1. Entra a **SQL Editor** → **New query**.
2. Copia y pega el contenido completo de `01_create_profiles.sql`, ejecútalo (Run).
3. En una nueva query, copia y pega `02_restrict_handle_new_user_execute.sql`, ejecútalo.
4. Ve a **Database → Advisors → Security** y confirma que no aparecen warnings.

Deben ejecutarse en este orden (01 antes que 02) porque el segundo depende de que la función creada en el primero ya exista.

Estos mismos archivos están versionados de forma permanente en `supabase/migrations/` (con nombre y formato de migración). Esta carpeta es solo una copia práctica para pegar y ejecutar manualmente; no forma parte de la estructura de código de la app.
