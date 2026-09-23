"use client";

import { useActionState, useState } from "react";
import { Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import {
  runGenerarExamen,
  runEvaluarExamen,
  type GenerateExamState,
  type EvaluateExamState,
  type PublicExamQuestion,
} from "@/lib/tools/examen/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Document } from "@/lib/documents/queries";

function ScoreSummary({ score }: { score: number }) {
  const colorClass = score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-destructive";
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <CardDescription>Resultado</CardDescription>
        <CardTitle className={`text-4xl ${colorClass}`}>{score}/100</CardTitle>
      </CardHeader>
    </Card>
  );
}

/**
 * Toma de examen + resultado, para UN intento específico. Se monta con
 * `key={examId}` desde el padre, así que cada examen nuevo arranca con
 * su propio estado limpio en vez de arrastrar el resultado calificado
 * del intento anterior.
 */
function ExamSession({
  examId,
  questions,
  onRestart,
}: {
  examId: string;
  questions: PublicExamQuestion[];
  onRestart: () => void;
}) {
  const [evalState, evalAction, evalPending] = useActionState<EvaluateExamState, FormData>(
    runEvaluarExamen,
    undefined,
  );

  const evalResult = evalState && "result" in evalState ? evalState.result : null;
  const evalError = evalState && "error" in evalState ? evalState.error : null;

  if (evalResult) {
    return (
      <div className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <ScoreSummary score={evalResult.score} />
        <div className="flex flex-col gap-3">
          {evalResult.questions.map((q, index) => (
            <Card key={index}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardDescription>Pregunta {index + 1}</CardDescription>
                  <CardTitle className="mt-1 text-base font-normal">{q.question}</CardTitle>
                </div>
                {q.correct ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <p>
                  <span className="font-medium">Tu respuesta:</span>{" "}
                  <span className="text-muted-foreground">
                    {q.type === "multiple_choice"
                      ? (q.options[Number(q.userAnswer)] ?? "(sin responder)")
                      : q.userAnswer || "(sin responder)"}
                  </span>
                </p>
                {!q.correct && (
                  <p>
                    <span className="font-medium">Respuesta correcta:</span>{" "}
                    <span className="text-muted-foreground">{q.correctAnswerText}</span>
                  </p>
                )}
                {q.feedback && <p className="text-muted-foreground">{q.feedback}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
        <Button type="button" variant="secondary" className="w-fit" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" />
          Generar otro examen
        </Button>
      </div>
    );
  }

  return (
    <form action={evalAction} className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      <input type="hidden" name="examId" value={examId} />
      {questions.map((q, index) => (
        <Card key={index}>
          <CardHeader>
            <CardDescription>
              Pregunta {index + 1} de {questions.length}
            </CardDescription>
            <CardTitle className="text-base font-normal">{q.question}</CardTitle>
          </CardHeader>
          <CardContent>
            {q.type === "multiple_choice" ? (
              <div className="flex flex-col gap-2">
                {q.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center gap-2 text-sm">
                    <input type="radio" name={`answer-${index}`} value={optionIndex} required />
                    {option}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                name={`answer-${index}`}
                rows={3}
                className="win98-well w-full border border-input bg-input p-3 text-sm"
                placeholder="Escribe tu respuesta…"
              />
            )}
          </CardContent>
        </Card>
      ))}

      {evalError && <p className="text-sm text-destructive">{evalError}</p>}

      <Button type="submit" disabled={evalPending} className="w-fit transition-transform active:scale-[0.98]">
        {evalPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {evalPending ? "Calificando…" : "Calificar examen"}
      </Button>
    </form>
  );
}

export function ExamenForm({ documents }: { documents: Document[] }) {
  const [genState, genAction, genPending] = useActionState<GenerateExamState, FormData>(
    runGenerarExamen,
    undefined,
  );
  const [restarted, setRestarted] = useState(false);

  const genResult = !restarted && genState && "result" in genState ? genState.result : null;
  const genError = !restarted && genState && "error" in genState ? genState.error : null;

  if (genResult) {
    return (
      <ExamSession
        key={genResult.examId}
        examId={genResult.examId}
        questions={genResult.questions}
        onRestart={() => setRestarted(true)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={genAction} onSubmit={() => setRestarted(false)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="documentId" className="text-sm font-medium">
            Documento de estudio
          </label>
          <select
            id="documentId"
            name="documentId"
            required
            disabled={documents.length === 0}
            className="win98-well h-9 w-full border border-input bg-input px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Selecciona un documento DOCX…</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="exampleExam" className="text-sm font-medium">
            Ejemplos de exámenes anteriores (opcional)
          </label>
          <textarea
            id="exampleExam"
            name="exampleExam"
            rows={4}
            placeholder="Pega aquí preguntas de exámenes anteriores para que la IA imite su formato y dificultad…"
            className="win98-well w-full border border-input bg-input p-3 text-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={genPending || documents.length === 0}
          className="w-fit transition-transform active:scale-[0.98]"
        >
          {genPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {genPending ? "Generando…" : "Generar examen"}
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

      {genError && <p className="text-sm text-destructive">{genError}</p>}
    </div>
  );
}
