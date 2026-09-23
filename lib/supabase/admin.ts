import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Cliente con `service_role` — bypassa RLS por completo. Solo para el
 * panel de admin (/admin/pagos): leer solicitudes de pago de TODOS los
 * usuarios y aprobar el plan Pro, algo que el trigger `protect_profile_plan`
 * bloquea explícitamente para el cliente autenticado normal. Nunca
 * exponer este cliente ni la service role key al navegador.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
