"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/config/admin";
import { PRO_PERIOD_DAYS } from "@/lib/config/plans";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    throw new Error("No autorizado.");
  }
}

export type ReviewPaymentState = { error: string } | { ok: true } | undefined;

export async function runApprovePayment(
  _prevState: ReviewPaymentState,
  formData: FormData,
): Promise<ReviewPaymentState> {
  await requireAdmin();

  const requestId = formData.get("requestId");
  if (typeof requestId !== "string" || !requestId) {
    return { error: "Solicitud inválida." };
  }

  const admin = createAdminClient();

  const { data: request, error: fetchError } = await admin
    .from("payment_requests")
    .select("user_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { error: "Solicitud no encontrada." };
  }
  if (request.status !== "pending") {
    return { error: "Esta solicitud ya fue revisada." };
  }

  const expiresAt = new Date(Date.now() + PRO_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: profileError } = await admin
    .from("profiles")
    .update({ plan: "pro", pro_expires_at: expiresAt })
    .eq("user_id", request.user_id);

  if (profileError) {
    return { error: "No se pudo activar el plan Pro." };
  }

  await admin
    .from("payment_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath("/admin/pagos");
  return { ok: true };
}

export async function runRejectPayment(
  _prevState: ReviewPaymentState,
  formData: FormData,
): Promise<ReviewPaymentState> {
  await requireAdmin();

  const requestId = formData.get("requestId");
  if (typeof requestId !== "string" || !requestId) {
    return { error: "Solicitud inválida." };
  }
  const reason = formData.get("reason");

  const admin = createAdminClient();

  const { error } = await admin
    .from("payment_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      rejection_reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    return { error: "No se pudo rechazar la solicitud." };
  }

  revalidatePath("/admin/pagos");
  return { ok: true };
}
