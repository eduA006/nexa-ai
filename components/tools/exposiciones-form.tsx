"use client";

import { useActionState, useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import {
  runExposicionAnalysis,
  type ExposicionActionState,
} from "@/lib/tools/exposiciones/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Document } from "@/lib/documents/queries";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="Copiar">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

export function ExposicionesForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<ExposicionActionState, FormData>(
    runExposicionAnalysis,
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
          {pending ? "Preparando…" : "Preparar exposición"}
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estructura sugerida</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {result.structure.map((section, index) => (
                <div key={index}>
                  <p className="text-sm font-medium">{section.section}</p>
                  <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                    {section.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex gap-2">
                        <span className="text-foreground">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Guion</CardTitle>
              <CopyButton text={result.script} />
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{result.script}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Posibles preguntas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {result.questions.map((qa, index) => (
                <div key={index} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{qa.question}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{qa.suggestedAnswer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
