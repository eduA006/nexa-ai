"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Download } from "lucide-react";
import { runGenerarDocumento, type DocumentoActionState } from "@/lib/tools/documentos/actions";
import { getDownloadUrl } from "@/lib/documents/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPES = [
  { value: "informe", label: "Informe" },
  { value: "memorando", label: "Memorando" },
  { value: "carta", label: "Carta" },
  { value: "propuesta", label: "Propuesta" },
] as const;

export function DocumentosForm() {
  const [state, action, pending] = useActionState<DocumentoActionState, FormData>(
    runGenerarDocumento,
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
        console.error("[Documentos] Error al descargar:", err);
        tab?.close();
        setDownloadError("Ocurrió un error al descargar el documento. Inténtalo nuevamente.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Tipo de documento</Label>
          <select
            id="type"
            name="type"
            defaultValue="informe"
            className="h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 text-sm transition-shadow focus-visible:shadow-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="instructions">
            Instrucciones (qué debe contener, para quién, contexto relevante)
          </Label>
          <textarea
            id="instructions"
            name="instructions"
            required
            rows={8}
            className="w-full rounded-md border border-input bg-transparent p-3 text-sm transition-shadow focus-visible:shadow-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-fit transition-transform active:scale-[0.98]"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Generando…" : "Generar documento"}
        </Button>
      </form>

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
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              También se guardó en tu lista de &quot;Mis documentos&quot;.
            </p>
            {result.sections.map((section, index) => (
              <div key={index}>
                {section.heading && <p className="text-sm font-medium">{section.heading}</p>}
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {section.content}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
