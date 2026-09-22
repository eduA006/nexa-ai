"use client";

import { useActionState, useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { runApaAnalysis, type ApaActionState } from "@/lib/tools/apa/actions";
import { generateCorrectedDocument } from "@/lib/tools/apa/client";
import { Button } from "@/components/ui/button";
import { FindingSection } from "@/components/tools/finding-section";
import type { Document } from "@/lib/documents/queries";

export function ApaForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<ApaActionState, FormData>(
    runApaAnalysis,
    undefined,
  );
  const [generating, startGenerate] = useTransition();
  const [generateError, setGenerateError] = useState<string | null>(null);

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;

  function handleGenerateCorrected() {
    if (!result) return;
    // Abre la pestaña de inmediato (dentro del gesto de clic) y la navega
    // luego: si se espera al await antes de window.open(), varios
    // navegadores lo bloquean por no parecer originado por el usuario.
    const tab = window.open("", "_blank", "noopener,noreferrer");
    setGenerateError(null);
    startGenerate(async () => {
      try {
        const outcome = await generateCorrectedDocument(result.documentId);
        if ("error" in outcome) {
          setGenerateError(outcome.error);
          tab?.close();
          return;
        }
        if (tab) tab.location.href = outcome.url;
      } catch (err) {
        console.error("[Apa] Error al generar documento corregido:", err);
        setGenerateError("Ocurrió un error al generar el documento corregido. Inténtalo nuevamente.");
        tab?.close();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          name="documentId"
          required
          disabled={documents.length === 0}
          className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm transition-shadow focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecciona un documento DOCX…</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          disabled={pending || documents.length === 0}
          className="transition-transform active:scale-[0.98]"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Analizando…" : "Analizar documento"}
        </Button>
      </form>

      {documents.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tienes documentos DOCX subidos. Sube uno en{" "}
          <a href="/documents" className="underline underline-offset-4">
            Mis documentos
          </a>
          .
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="flex flex-col gap-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <p className="text-xs text-muted-foreground">
            Las recomendaciones son asistidas por IA y reglas automatizadas y deben ser
            revisadas por el usuario. No garantizan el cumplimiento perfecto de APA 7.
            Formato y redacción se evalúan por separado: son evaluaciones de naturaleza
            distinta (objetiva vs. asistida por IA).
          </p>

          <FindingSection
            title="Formato (reglas automáticas)"
            description="Márgenes, tipografía, interlineado, sangría, numeración y estructura."
            score={result.formatScore}
            findings={result.formatFindings}
          />

          <div className="flex flex-col gap-2 rounded-lg border p-4 transition-shadow hover:shadow-sm">
            <p className="text-sm font-medium">Generar DOCX corregido</p>
            <p className="text-sm text-muted-foreground">
              Corrige automáticamente márgenes, interlineado, sangría, fuente y tamaño.
              No modifica el contenido del texto ni agrega numeración de página o
              referencias — revisa esos puntos manualmente.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={generating}
              onClick={handleGenerateCorrected}
              className="w-fit"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {generating ? "Generando…" : "Generar y descargar"}
            </Button>
            {generateError && <p className="text-sm text-destructive">{generateError}</p>}
          </div>

          <FindingSection
            title="Redacción (evaluación de IA)"
            description={result.aiSummary}
            score={result.writingScore}
            findings={result.writingFindings}
          />
        </div>
      )}
    </div>
  );
}
