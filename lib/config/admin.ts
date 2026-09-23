/**
 * No hay un rol "admin" en la base de datos (evita otra columna que
 * proteger contra auto-escritura) — se identifica por email vía
 * `ADMIN_EMAILS` (coma-separado), comparado server-side únicamente.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
