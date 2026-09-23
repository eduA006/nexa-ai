import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { isAdminEmail } from "@/lib/config/admin";
import { getPendingPaymentRequests } from "@/lib/payments/admin-queries";
import { PaymentRequestCard } from "@/components/admin/payment-request-card";

export const metadata: Metadata = { title: "Pagos pendientes" };

export default async function AdminPagosPage() {
  const session = await getCurrentUser();
  if (!isAdminEmail(session?.user.email)) notFound();

  const requests = await getPendingPaymentRequests();

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagos pendientes</h1>
        <p className="text-muted-foreground">
          Comprobantes de Yape esperando revisión. Aprobar activa Pro por 7 días.
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((request) => (
            <PaymentRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
