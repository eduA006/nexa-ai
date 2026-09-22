"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Download } from "lucide-react";
import { runGenerarInforme, type InformeActionState } from "@/lib/tools/informes/actions";
import { getDownloadUrl } from "@/lib/documents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Document } from "@/lib/documents/queries";

export function InformesForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<InformeActionState, FormData>(
    runGenerarInforme,
    undefined,
  );
  const [downloading, startDownload] = useTransition();
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;

  function handleDownload() {
    if (!result) return;
    setDownloadError(null);
    // Abre la pestaña de inmediato (dentro del gesto de clic) y la navega
    // luego: si se espera al await antes de window.open(), varios
    // navegadores lo bloquean por no parecer originado por el usuario.
    const tab = window.open("", "_blank", "noopener,noreferrer");
    // Un Server Action invocado directo (sin <form> ni startTransition)
    // desde un event handler no se despacha correctamente en esta
    // versión de Next.js — ver node_modules/next/dist/docs/01-app/
    // 02-guides/server-actions.md.
    startDownload(async () => {
      try {
        const url = await getDownloadUrl(result.storagePath);
        if (url && tab) {
          tab.location.href = url;
        } else {
          tab?.close();
          setDownloadError("No se pudo generar el enlace de descarga. Inténtalo nuevamente.");
        }
      } catch (err) {
        console.error("[Informes] Error al descargar:", err);
        tab?.close();
        setDownloadError("Ocurrió un error al descargar el informe. Inténtalo nuevamente.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="documentId">Fuente de datos</Label>
          <select
            id="documentId"
            name="documentId"
            required
            disabled={documents.length === 0}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm transition-shadow focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Selecciona un documento XLSX o CSV…</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Título del informe (opcional)</Label>
          <Input id="title" name="title" placeholder="ej. Informe de ventas — Q1 2026" />
        </div>

        <Button
          type="submit"
          disabled={pending || documents.length === 0}
          className="w-fit transition-transform active:scale-[0.98]"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Generando…" : "Generar informe"}
        </Button>
      </form>

      {documents.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tienes documentos XLSX o CSV subidos. Sube uno en{" "}
          <a href="/documents" className="underline underline-offset-4">
            Mis documentos
          </a>
          .
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {downloadError && <p className="text-sm text-destructive">{downloadError}</p>}

      {result && (
        <Card className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{result.title}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar .docx
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              El informe completo (con tabla de estadísticas) se descargó como DOCX y
              también se guardó en tu lista de &quot;Mis documentos&quot;. Vista previa del
              contenido:
            </p>
            <p className="text-sm text-muted-foreground">{result.aiSummary}</p>
            {result.trends.length > 0 && (
              <div>
                <p className="text-sm font-medium">Tendencias</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {result.trends.map((trend, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-foreground">•</span>
                      {trend}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
