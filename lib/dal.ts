import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type Profile = Tables<"profiles">;

/**
 * Usuario autenticado + su perfil, memoizado por request. `null` si no
 * hay sesión. Único punto de acceso a esta información — no consultar
 * `profiles` directamente desde páginas/componentes.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return { user, profile: profile as Profile | null };
});
