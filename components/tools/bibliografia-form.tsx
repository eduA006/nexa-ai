"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  runBibliografiaAnalysis,
  type BibliografiaActionState,
} from "@/lib/tools/bibliografia/actions";
import { Button } from "@/components/ui/button";
import { FindingSection } from "@/components/tools/finding-section";
import type { Document } from "@/lib/documents/queries";

export function BibliografiaForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<BibliografiaActionState, FormData>(
    runBibliografiaAnalysis,
    undefined,
  );

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;

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
          {pending ? "Analizando…" : "Analizar bibliografía"}
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
        <div className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <p className="text-xs text-muted-foreground">
            Este análisis es 100% automático (sin IA) basado en reconocimiento de
            patrones de texto. Formatos de cita poco convencionales pueden no
            detectarse correctamente — revisa los resultados manualmente.
          </p>

          <FindingSection
            title="Citas vs. referencias"
            description={`Se detectaron ${result.citationCount} cita${result.citationCount === 1 ? "" : "s"} única${result.citationCount === 1 ? "" : "s"} en el texto y ${result.referenceCount} entrada${result.referenceCount === 1 ? "" : "s"} en la sección de referencias.`}
            score={result.score}
            findings={result.findings}
          />
        </div>
      )}
    </div>
  );
}
