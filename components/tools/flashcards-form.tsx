"use client";

import { useActionState, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { runGenerarFlashcards, type FlashcardsActionState } from "@/lib/tools/flashcards/actions";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import type { Document } from "@/lib/documents/queries";

function FlashcardViewer({ topic, cards }: { topic: string; cards: { question: string; answer: string }[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = cards[index];

  function goTo(nextIndex: number) {
    setIndex(nextIndex);
    setRevealed(false);
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base">{topic}</CardTitle>
        <span className="text-sm text-muted-foreground">
          Tarjeta {index + 1} de {cards.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="win98-panel flex min-h-[220px] flex-col items-center justify-center gap-3 bg-card p-8 text-center"
      >
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {revealed ? "Respuesta" : "Pregunta"}
        </span>
        <p className="text-lg">{revealed ? card.answer : card.question}</p>
        <span className="text-xs text-muted-foreground">(clic para {revealed ? "ver la pregunta" : "revelar la respuesta"})</span>
      </button>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => goTo(0)} disabled={index === 0 && !revealed}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reiniciar
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => goTo(index + 1)}
          disabled={index === cards.length - 1}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function FlashcardsForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<FlashcardsActionState, FormData>(
    runGenerarFlashcards,
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
          className="win98-well h-9 flex-1 border border-input bg-input px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
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
          {pending ? "Generando…" : "Generar tarjetas"}
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

      {result && <FlashcardViewer topic={result.topic} cards={result.cards} />}
    </div>
  );
}
