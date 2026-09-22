"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Download } from "lucide-react";
import { runGenerarDocumento, type DocumentoActionState } from "@/lib/tools/documentos/actions";
import { fetchDownloadUrl, triggerFileDownload } from "@/lib/documents/client";
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
    startDownload(async () => {
      try {
        const url = await fetchDownloadUrl(result.storagePath);
        if (url) {
          triggerFileDownload(url);
        } else {
          setDownloadError("No se pudo generar el enlace de descarga. Inténtalo nuevamente.");
        }
      } catch (err) {
        console.error("[Documentos] Error al descargar:", err);
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
