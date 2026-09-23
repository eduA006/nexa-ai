"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  runAnalizadorRiesgosContratos,
  type RiesgosContratosActionState,
} from "@/lib/tools/riesgos-contratos/actions";
import type { ContractClauseFlag } from "@/lib/ai/prompts/riesgos-contratos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Document } from "@/lib/documents/queries";

const DEVIATION_LABEL: Record<ContractClauseFlag["deviation"], string> = {
  leve: "Desviación leve",
  notable: "Desviación notable",
  significativa: "Desviación significativa",
};

const DEVIATION_VARIANT: Record<ContractClauseFlag["deviation"], "secondary" | "outline" | "destructive"> = {
  leve: "secondary",
  notable: "outline",
  significativa: "destructive",
};

export function RiesgosContratosForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<RiesgosContratosActionState, FormData>(
    runAnalizadorRiesgosContratos,
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
          className="h-9 flex-1 rounded-md win98-well border border-input bg-input px-3 text-sm transition-shadow focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
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
          {pending ? "Analizando…" : "Analizar contrato"}
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
            Este análisis compara la redacción del contrato contra prácticas contractuales
            comunes y señala patrones atípicos. NO es asesoría legal, no evalúa validez ni
            legalidad, y no sustituye la revisión de un abogado antes de firmar o actuar.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cláusulas con redacción atípica</CardTitle>
              <CardDescription>
                Ordenadas como las detectó la IA. La &quot;desviación&quot; indica qué tan distinta
                es de la redacción común, no un juicio legal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.flags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No se detectaron cláusulas con redacción atípica.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {result.flags.map((flag, index) => (
                    <div key={index} className="win98-well flex flex-col gap-1.5 bg-input p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary">{flag.category}</Badge>
                        <Badge variant={DEVIATION_VARIANT[flag.deviation]}>
                          {DEVIATION_LABEL[flag.deviation]}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground italic">&quot;{flag.clause}&quot;</p>
                      <p className="text-sm text-muted-foreground">{flag.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cláusulas comúnmente esperadas que no se encontraron</CardTitle>
            </CardHeader>
            <CardContent>
              {result.missingClauses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No se identificaron ausencias claras, o no fue posible determinar el tipo
                  de contrato con suficiente confianza.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {result.missingClauses.map((clause, index) => (
                    <Badge key={index} variant="outline">
                      {clause}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
