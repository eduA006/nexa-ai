"use client";

import { useActionState, useMemo, useState } from "react";
import { runApaAnalysis, type ApaActionState } from "@/lib/tools/apa/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FindingItem } from "@/components/tools/finding-item";
import type { Document } from "@/lib/documents/queries";
import type { RuleSeverity } from "@/lib/rules/apa";

const SEVERITY_ORDER: Record<RuleSeverity, number> = { error: 0, warning: 1, info: 2 };

const INITIAL_VISIBLE = 5;

export function ApaForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<ApaActionState, FormData>(
    runApaAnalysis,
    undefined,
  );
  const [showAll, setShowAll] = useState(false);

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;

  const sortedFindings = useMemo(() => {
    if (!result) return [];
    return [...result.findings].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    );
  }, [result]);

  const visibleFindings = showAll ? sortedFindings : sortedFindings.slice(0, INITIAL_VISIBLE);
  const hiddenCount = sortedFindings.length - visibleFindings.length;

  const counts = useMemo(() => {
    const base: Record<RuleSeverity, number> = { error: 0, warning: 0, info: 0 };
    sortedFindings.forEach((f) => base[f.severity]++);
    return base;
  }, [sortedFindings]);

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          name="documentId"
          required
          disabled={documents.length === 0}
          className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecciona un documento DOCX…</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={pending || documents.length === 0}>
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
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Puntaje heurístico: {result.score}/100</p>
            <p className="mt-1 text-sm text-muted-foreground">{result.aiSummary}</p>
            {sortedFindings.length > 0 && (
              <div className="mt-3 flex gap-2">
                {counts.error > 0 && (
                  <Badge variant="secondary">{counts.error} errores</Badge>
                )}
                {counts.warning > 0 && (
                  <Badge variant="secondary">{counts.warning} advertencias</Badge>
                )}
                {counts.info > 0 && <Badge variant="secondary">{counts.info} info</Badge>}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Las recomendaciones son asistidas por IA y reglas automatizadas y deben ser
            revisadas por el usuario. No garantizan el cumplimiento perfecto de APA 7.
          </p>

          {sortedFindings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No se encontraron observaciones.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {visibleFindings.map((finding, index) => (
                  <FindingItem key={index} finding={finding} />
                ))}
              </ul>
              {hiddenCount > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAll(true)} className="w-fit">
                  Mostrar {hiddenCount} más
                </Button>
              )}
              {showAll && sortedFindings.length > INITIAL_VISIBLE && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll(false)} className="w-fit">
                  Mostrar menos
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
