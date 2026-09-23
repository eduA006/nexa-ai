import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type PaymentRequest = Tables<"payment_requests">;

/** La solicitud de pago más reciente del usuario (para mostrar su estado en Ajustes). */
export const getLatestPaymentRequest = cache(async (): Promise<PaymentRequest | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
});
