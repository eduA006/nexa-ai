"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { runWritingAnalysis, type WritingActionState } from "@/lib/tools/writing/actions";
import { Button } from "@/components/ui/button";
import { FindingSection } from "@/components/tools/finding-section";
import type { Document } from "@/lib/documents/queries";

export function WritingForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<WritingActionState, FormData>(
    runWritingAnalysis,
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
            Esto NO es un detector de texto generado por IA — ningún método basado en
            estas señales puede determinar con certeza el origen de un texto. Son
            indicadores de estilo (variedad de oraciones, repetición, vocabulario,
            muletillas) pensados para que revises y mejores tu redacción, no una
            acusación ni una certificación de nada.
          </p>

          <FindingSection
            title="Estilo (reglas automáticas)"
            description="Variedad de oraciones, diversidad léxica, repetición y muletillas académicas."
            score={result.styleScore}
            findings={result.styleFindings}
          />

          <FindingSection
            title="Observaciones cualitativas (IA)"
            description={result.aiSummary}
            score={result.aiScore}
            findings={result.aiFindings}
          />
        </div>
      )}
    </div>
  );
}
