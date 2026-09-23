"use client";

import { useActionState, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { runGenerarFlashcards, type FlashcardsActionState } from "@/lib/tools/flashcards/actions";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import type { Document } from "@/lib/documents/queries";

function CardFace({
  label,
  text,
  hint,
  className,
}: {
  label: string;
  text: string;
  hint: string;
  className?: string;
}) {
  return (
    <div
      className={`flip-card-face win98-panel flex min-h-[240px] flex-col items-center justify-center gap-3 bg-card p-8 text-center ${className ?? ""}`}
    >
      <span className="text-xs font-bold tracking-wide text-primary uppercase">{label}</span>
      <p className="text-lg leading-snug">{text}</p>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

function FlashcardViewer({ topic, cards }: { topic: string; cards: { question: string; answer: string }[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = cards[index];
  const progressPct = ((index + 1) / cards.length) * 100;
  const stackDepth = Math.min(2, cards.length - 1 - index);

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

      <div className="win98-well h-2.5 w-full overflow-hidden bg-input">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Pila: tarjetas "fantasma" detrás de la actual, sugieren cuántas faltan. */}
      <div className="relative">
        {stackDepth >= 2 && (
          <div className="win98-panel absolute inset-0 translate-x-3 translate-y-3 rotate-2 bg-muted" />
        )}
        {stackDepth >= 1 && (
          <div className="win98-panel absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-1 bg-muted" />
        )}

        <div className="flip-card-container relative">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Ver la pregunta" : "Revelar la respuesta"}
            className={`flip-card-inner relative block w-full ${revealed ? "is-flipped" : ""}`}
          >
            <CardFace label="Pregunta" text={card.question} hint="Clic para revelar la respuesta" />
            <CardFace label="Respuesta" text={card.answer} hint="Clic para volver a la pregunta" className="flip-card-back" />
          </button>
        </div>
      </div>

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
