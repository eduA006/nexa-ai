"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Loader2, Clock, XCircle } from "lucide-react";
import { runSubmitPaymentProof, type SubmitPaymentState } from "@/lib/payments/actions";
import { Button } from "@/components/ui/button";
import { PRO_PRICE_PEN } from "@/lib/config/plans";
import type { PaymentRequest } from "@/lib/payments/queries";

export function PaymentForm({ latestRequest }: { latestRequest: PaymentRequest | null }) {
  const [state, action, pending] = useActionState<SubmitPaymentState, FormData>(
    runSubmitPaymentProof,
    undefined,
  );

  const error = state && "error" in state ? state.error : null;
  const submitted = state && "ok" in state;

  if (!submitted && latestRequest?.status === "pending") {
    return (
      <div className="win98-well flex items-start gap-3 bg-input p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Tu comprobante está en revisión</p>
          <p className="text-xs text-muted-foreground">
            Lo enviaste el{" "}
            {new Date(latestRequest.created_at).toLocaleDateString("es-PE", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
            . Te avisamos apenas se revise.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="win98-well flex items-start gap-3 bg-input p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Comprobante enviado</p>
          <p className="text-xs text-muted-foreground">
            Quedó en revisión. Te avisamos apenas se apruebe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {latestRequest?.status === "rejected" && (
        <div className="win98-well flex items-start gap-3 bg-input p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Tu último comprobante fue rechazado</p>
            {latestRequest.rejection_reason && (
              <p className="text-xs text-muted-foreground">{latestRequest.rejection_reason}</p>
            )}
            <p className="text-xs text-muted-foreground">Puedes intentarlo de nuevo abajo.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="win98-panel shrink-0 overflow-hidden bg-card p-1">
          <Image src="/yape-qr.jpg" alt="Código QR de Yape" width={160} height={220} className="h-auto w-40" />
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">1.</span> Abre tu app Yape y escanea
            el código, o busca a <span className="font-medium text-foreground">Eduardo Antonio Alvarez Alvarez</span>.
          </p>
          <p>
            <span className="font-medium text-foreground">2.</span> Yapea{" "}
            <span className="font-medium text-foreground">S/ {PRO_PRICE_PEN.toFixed(2)}</span> (Pro,
            vigente 7 días).
          </p>
          <p>
            <span className="font-medium text-foreground">3.</span> Sube la captura del
            comprobante abajo.
          </p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          name="proof"
          accept="image/jpeg,image/png,image/webp"
          required
          className="win98-well flex-1 border border-input bg-input px-3 py-1.5 text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
        />
        <Button type="submit" disabled={pending} className="transition-transform active:scale-[0.98]">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Enviando…" : "Enviar comprobante"}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
