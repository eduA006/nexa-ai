"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validatePaymentProof } from "@/lib/payments/validate";
import { PRO_PRICE_PEN } from "@/lib/config/plans";

const BUCKET = "payment-proofs";

export type SubmitPaymentState = { error: string } | { ok: true } | undefined;

export async function runSubmitPaymentProof(
  _prevState: SubmitPaymentState,
  formData: FormData,
): Promise<SubmitPaymentState> {
  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sube una captura del comprobante de Yape." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesión expirada. Vuelve a iniciar sesión." };
  }

  const { count: pendingCount } = await supabase
    .from("payment_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  if ((pendingCount ?? 0) > 0) {
    return { error: "Ya tienes un comprobante en revisión. Espera a que se apruebe o se rechace." };
  }

  const validation = await validatePaymentProof(file);
  if (!validation.ok) {
    return { error: validation.error };
  }

  const storagePath = `${user.id}/${crypto.randomUUID()}.${validation.type}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });

  if (uploadError) {
    return { error: "No se pudo subir la captura. Inténtalo nuevamente." };
  }

  const { error: insertError } = await supabase.from("payment_requests").insert({
    user_id: user.id,
    amount_pen: PRO_PRICE_PEN,
    period: "weekly",
    proof_storage_path: storagePath,
    status: "pending",
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: "No se pudo registrar la solicitud. Inténtalo nuevamente." };
  }

  revalidatePath("/settings");
  return { ok: true };
}
