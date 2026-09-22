"use client";

import { useActionState, useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import {
  runPresentationGeneration,
  type PresentationActionState,
} from "@/lib/tools/presentaciones/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PresentationResult } from "@/lib/ai/prompts/presentaciones";
import type { Document } from "@/lib/documents/queries";

function slidesAsText(slides: PresentationResult["slides"]): string {
  return slides
    .map(
      (slide, index) =>
        `Diapositiva ${index + 1}: ${slide.title}\n${slide.bullets.map((b) => `• ${b}`).join("\n")}\n\nNotas: ${slide.speakerNotes}`,
    )
    .join("\n\n---\n\n");
}

export function PresentacionesForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<PresentationActionState, FormData>(
    runPresentationGeneration,
    undefined,
  );
  const [copied, setCopied] = useState(false);

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;

  async function handleCopyAll() {
    if (!result) return;
    await navigator.clipboard.writeText(slidesAsText(result.slides));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

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
          {pending ? "Generando…" : "Generar diapositivas"}
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {result.slides.length} diapositivas generadas. No se genera un archivo
              .pptx — copia el contenido a tu editor de presentaciones.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={handleCopyAll}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copiar todo
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {result.slides.map((slide, index) => (
              <Card
                key={index}
                className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${index * 40}ms`, animationFillMode: "backwards" }}
              >
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{slide.title}</CardTitle>
                  <Badge variant="secondary">{index + 1}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {slide.bullets.length > 0 && (
                    <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {slide.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex gap-2">
                          <span className="text-foreground">•</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="border-t pt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Notas: </span>
                    {slide.speakerNotes}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
