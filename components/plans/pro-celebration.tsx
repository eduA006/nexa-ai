"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CELEBRATED_KEY_PREFIX = "nexa-pro-celebrated-";

function fireConfetti() {
  const end = Date.now() + 1500;
  const colors = ["#000080", "#1084d0", "#ffffff", "#c0c0c0"];

  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, startVelocity: 45, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 55, startVelocity: 45, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

type MinimalPaymentRequest = { id: string; status: string } | null;

/**
 * Festeja en vivo cuando el admin aprueba el pago — se suscribe a
 * Realtime filtrado a la fila del propio usuario (RLS ya restringe a
 * "select own", Realtime respeta esa policy). También cubre el caso de
 * que la aprobación haya ocurrido mientras el usuario no estaba en la
 * página: si `latestRequest` ya llega aprobado y no se había festejado
 * antes (localStorage por id de solicitud), festeja igual al montar.
 */
export function ProCelebration({
  userId,
  latestRequest,
}: {
  userId: string;
  latestRequest: MinimalPaymentRequest;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const celebratedRef = useRef(false);

  function celebrate(requestId: string) {
    if (celebratedRef.current) return;
    celebratedRef.current = true;
    localStorage.setItem(CELEBRATED_KEY_PREFIX + requestId, "1");
    fireConfetti();
    setVisible(true);
    router.refresh();
    setTimeout(() => setVisible(false), 6000);
  }

  useEffect(() => {
    if (!latestRequest) return;
    if (latestRequest.status !== "approved") return;
    if (localStorage.getItem(CELEBRATED_KEY_PREFIX + latestRequest.id)) return;
    celebrate(latestRequest.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestRequest?.id, latestRequest?.status]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`payment-requests-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "payment_requests", filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = payload.new as { id: string; status: string };
          if (next.status === "approved") celebrate(next.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div className="win98-panel pointer-events-auto flex items-center gap-3 bg-card px-4 py-3 animate-in fade-in-0 slide-in-from-top-4 duration-500">
        <PartyPopper className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">¡Cuenta Pro activada!</p>
          <p className="text-xs text-muted-foreground">Ya puedes usar todas las herramientas Pro.</p>
        </div>
      </div>
    </div>
  );
}
