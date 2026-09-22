"use client";

import { useActionState, useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { runSummarize, type SummarizeActionState } from "@/lib/tools/summarize/actions";
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
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      aria-label="Copiar"
      title="Copiar"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function SummarySection({
  title,
  text,
  delay,
}: {
  title: string;
  text: string;
  delay: number;
}) {
  return (
    <Card
      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <CopyButton text={text} />
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

export function SummarizeForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<SummarizeActionState, FormData>(
    runSummarize,
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
          {pending ? "Resumiendo…" : "Resumir documento"}
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
          <SummarySection title="Resumen breve" text={result.shortSummary} delay={0} />
          <SummarySection title="Resumen detallado" text={result.detailedSummary} delay={60} />

          <Card
            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
          >
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Ideas clave</CardTitle>
              <CopyButton text={result.keyPoints.map((p) => `• ${p}`).join("\n")} />
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {result.keyPoints.map((point, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-foreground">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <SummarySection title="Conclusiones" text={result.conclusions} delay={180} />
        </div>
      )}
    </div>
  );
}
