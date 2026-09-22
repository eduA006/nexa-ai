# SECURITY — NEXA AI

## Auditoría Fase 13 (2026-09-22)

Auditoría manual de todo el código (no diff de PR — el repo no tiene remoto ni rama separada todavía). Cubrió: server actions, RLS, subida de archivos, límites de IA, exposición de secretos, XSS/inyección, middleware de auth y llamadas salientes a APIs de terceros con input del usuario.

### Hallazgos corregidos

1. **SSRF en búsqueda de referencias por URL** (`lib/citations/lookup.ts`, usado por `/tools/referencias-apa`). El usuario pega una URL y el servidor la consulta con `fetch()` para extraer `<title>`/`og:site_name`. Sin validación, esto permitía que el servidor consultara direcciones internas o el endpoint de metadata de la nube (`169.254.169.254`), y no tenía límite de tamaño ni timeout. **Fix**: `assertSafeExternalUrl()` exige `http`/`https`, resuelve el hostname vía DNS y rechaza IPs privadas/loopback/link-local (protege también contra DNS rebinding, ya que valida la IP resuelta, no el string), bloquea `localhost`, deshabilita redirecciones (`redirect: "error"`), y `fetchWithGuards()` aplica timeout de 5s y tope de 2MB de respuesta. Verificado con un script standalone contra 5 casos reales (sitio público, loopback, `localhost`, IP de metadata, esquema `file:`): los 4 maliciosos se bloquean, el legítimo funciona.

2. **`getDownloadUrl` sin verificación de dueño** (`lib/documents/actions.ts`). A diferencia de las demás ~18 acciones del proyecto (todas verifican `auth.getUser()` + `.eq("user_id", user.id)` antes de tocar datos), esta firmaba una URL de descarga para cualquier `storagePath` recibido del cliente sin comprobar que perteneciera al usuario autenticado. Hoy no era explotable porque la política RLS de Storage (`documents_storage_select_own`) ya bloquea el acceso cruzado entre usuarios a nivel de base de datos — pero era un único punto de falla sin defensa en profundidad. **Fix**: se agregó verificación explícita contra la tabla `documents` (como `storage_path` original o `processed_storage_path`) antes de firmar. Se usaron dos consultas separadas (no `.or()` con interpolación de string) porque `storagePath` es un parámetro de una función exportada que un cliente podría invocar directamente con un valor arbitrario — evita cualquier riesgo de inyección en el filtro de PostgREST.

3. **Esquema `javascript:` sin filtrar en referencias APA generadas** (`lib/citations/apa-reference.ts`). El HTML generado (mostrado con `dangerouslySetInnerHTML` solo en la sesión del propio usuario, nunca persistido ni compartido) escapaba correctamente el texto de la URL, pero no validaba su *esquema* antes de ponerla en un `href`. Un valor como `javascript:alert(1)` pasaba intacto. Impacto limitado a self-XSS dado que nunca se persiste ni se muestra a otros usuarios, pero se corrigió igual. **Fix**: `safeHref()` solo permite `http`/`https`; cualquier otro esquema se neutraliza a `"#"`.

### Confirmado sin hallazgos

- **Ownership scoping**: las ~18 server actions de herramientas y documentos verifican `auth.getUser()` y escopan toda lectura/escritura con `.eq("user_id", user.id)` (excepto el hallazgo #2, ya corregido).
- **Límites de IA**: las 16 acciones que llaman a un proveedor de IA verifican `MAX_AI_REQUESTS_PER_DAY` contra `ai_sessions` antes de llamar (las 2 herramientas sin IA, Bibliografía y Referencias APA, no aplican).
- **Subida de archivos**: tipo validado por firma de bytes (no por extensión/MIME), tamaño limitado server-side, nombre de archivo saneado (`[^\w.\-]+` → `_`) — sin riesgo de path traversal.
- **Secretos**: `SUPABASE_SERVICE_ROLE_KEY` no se usa en ningún lado del código (todo pasa por RLS con la key anónima); `GEMINI_API_KEY`/`GROQ_API_KEY` solo se referencian en archivos marcados `server-only`.
- **Manejo de errores**: ningún `catch` de las server actions filtra `error.message` ni stacks al cliente — todos devuelven strings genéricos.
- **RLS**: las 5 tablas con datos de usuario (`profiles`, `documents`, `ai_sessions`, `document_analyses`, `document_chat_messages`) tienen RLS habilitado con políticas verificadas leyendo el SQL de las migraciones directamente, no solo la documentación.
- **Middleware**: `lib/supabase/middleware.ts` protege todas las rutas de la app y redirige a `/login` sin sesión.
- **Generación de DOCX**: `documento-docx.ts`/`informe-docx.ts` usan la API tipada de la librería `docx` (nunca concatenación cruda de XML con texto de usuario); `docx-corrections.ts` sí manipula XML crudo pero solo toca propiedades estructurales fijas (márgenes, interlineado, fuente), nunca contenido de usuario.

### Aceptado sin cambios (informativo)

- El registro y la recuperación de contraseña no tienen throttling propio además del que aplica Supabase Auth (`over_email_send_rate_limit`, manejado correctamente). Se documenta como aceptable por ahora; revisar si en producción los límites por defecto de Supabase resultan insuficientes.

## Tests (Vitest)

Los tres hallazgos corregidos tienen cobertura de test: `lib/citations/lookup.test.ts` prueba el guard SSRF contra IPs privadas/loopback/metadata de nube y esquemas no-http; `lib/citations/apa-reference.test.ts` prueba que `safeHref()` neutraliza esquemas `javascript:`/no-http. Además se agregó cobertura para toda la lógica de reglas deterministas (`lib/rules/*`) y la validación de archivos por firma de bytes (`lib/documents/validate.ts`), ya que son la superficie de lógica pura más grande del proyecto y no dependían de ninguna verificación automatizada hasta ahora. Ver `docs/DEVELOPMENT.md` para el alcance completo de qué se prueba y qué no (las herramientas con IA real se siguen verificando manualmente).
