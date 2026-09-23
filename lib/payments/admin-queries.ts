import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type PendingPaymentRequest = {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  amountPen: number;
  period: string;
  createdAt: string;
  proofUrl: string | null;
};

const BUCKET = "payment-proofs";

/** Todas las solicitudes pendientes, con nombre/correo del usuario y una URL firmada del comprobante. */
export async function getPendingPaymentRequests(): Promise<PendingPaymentRequest[]> {
  const admin = createAdminClient();

  const { data: requests } = await admin
    .from("payment_requests")
    .select("id, user_id, amount_pen, period, proof_storage_path, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!requests || requests.length === 0) return [];

  const userIds = [...new Set(requests.map((r) => r.user_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, email, full_name")
    .in("user_id", userIds);

  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  return Promise.all(
    requests.map(async (request) => {
      const { data: signed } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(request.proof_storage_path, 60 * 5);

      const profile = profileByUserId.get(request.user_id);

      return {
        id: request.id,
        userId: request.user_id,
        email: profile?.email ?? "—",
        fullName: profile?.full_name ?? null,
        amountPen: Number(request.amount_pen),
        period: request.period,
        createdAt: request.created_at,
        proofUrl: signed?.signedUrl ?? null,
      };
    }),
  );
}
