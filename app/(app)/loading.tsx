import { Loader2 } from "lucide-react";

/**
 * Envuelve automáticamente cada página de este segmento en un límite
 * de Suspense (convención de Next.js): mientras el Server Component de
 * la ruta destino resuelve sus datos, se muestra este esqueleto en vez
 * de dejar la navegación en blanco.
 */
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
