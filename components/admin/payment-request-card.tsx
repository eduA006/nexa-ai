"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Loader2, Check, X } from "lucide-react";
import {
  runApprovePayment,
  runRejectPayment,
  type ReviewPaymentState,
} from "@/lib/payments/admin-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PendingPaymentRequest } from "@/lib/payments/admin-queries";

export function PaymentRequestCard({ request }: { request: PendingPaymentRequest }) {
  const [approveState, approveAction, approvePending] = useActionState<ReviewPaymentState, FormData>(
    runApprovePayment,
    undefined,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState<ReviewPaymentState, FormData>(
    runRejectPayment,
    undefined,
  );
  const [showReject, setShowReject] = useState(false);

  const approveError = approveState && "error" in approveState ? approveState.error : null;
  const rejectError = rejectState && "error" in rejectState ? rejectState.error : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{request.fullName ?? request.email}</CardTitle>
        <CardDescription>
          {request.email} — S/ {request.amountPen.toFixed(2)} ({request.period === "weekly" ? "semanal" : request.period}) —{" "}
          {new Date(request.createdAt).toLocaleString("es-PE")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {request.proofUrl ? (
          <a href={request.proofUrl} target="_blank" rel="noopener noreferrer" className="win98-well w-fit bg-input">
            <Image
              src={request.proofUrl}
              alt="Comprobante de pago"
              width={280}
              height={400}
              unoptimized
              className="h-auto max-h-64 w-auto object-contain"
            />
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No se pudo cargar el comprobante.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <form action={approveAction}>
            <input type="hidden" name="requestId" value={request.id} />
            <Button type="submit" disabled={approvePending || rejectPending} className="transition-transform active:scale-[0.98]">
              {approvePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Aprobar
            </Button>
          </form>

          {!showReject ? (
            <Button
              type="button"
              variant="secondary"
              disabled={approvePending || rejectPending}
              onClick={() => setShowReject(true)}
            >
              <X className="h-4 w-4" />
              Rechazar
            </Button>
          ) : (
            <form action={rejectAction} className="flex flex-1 flex-wrap items-center gap-2">
              <input type="hidden" name="requestId" value={request.id} />
              <input
                type="text"
                name="reason"
                placeholder="Motivo (opcional)"
                className="win98-well h-8 min-w-40 flex-1 border border-input bg-input px-2 text-sm"
              />
              <Button type="submit" variant="secondary" disabled={rejectPending} className="text-destructive">
                {rejectPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar rechazo
              </Button>
            </form>
          )}
        </div>

        {approveError && <p className="text-sm text-destructive">{approveError}</p>}
        {rejectError && <p className="text-sm text-destructive">{rejectError}</p>}
      </CardContent>
    </Card>
  );
}
