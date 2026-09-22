"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary del segmento (app): evita que un error no controlado
 * en cualquier página autenticada tumbe toda la sesión del usuario con
 * la pantalla de error genérica de Next.js — muestra algo recuperable
 * en su lugar. Debe ser un Client Component (requisito de Next.js).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div>
        <p className="font-medium">Ocurrió un error inesperado.</p>
        <p className="text-sm text-muted-foreground">
          Inténtalo nuevamente. Si el problema persiste, recarga la página.
        </p>
      </div>
      <Button onClick={() => reset()}>Reintentar</Button>
    </div>
  );
}
