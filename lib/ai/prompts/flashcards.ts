import { z } from "zod";

export const flashcardsResultSchema = z.object({
  topic: z.string(),
  cards: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .min(1)
    .max(25),
});

export type FlashcardsResult = z.infer<typeof flashcardsResultSchema>;

const MAX_CHARS = 12000;

export function buildFlashcardsPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  return `Eres un asistente que convierte documentos de estudio en tarjetas de memoria (flashcards) en español, para practicar recuerdo activo.

A partir del documento, genera:
- "topic": un título corto (3-8 palabras) que resuma el tema general del documento.
- "cards": entre 8 y 25 tarjetas (según cuánto contenido relevante tenga el documento), cada una con:
  - "question": una pregunta corta y específica sobre un concepto, definición, dato o relación del documento. Evita preguntas de sí/no; prioriza "¿Qué es...?", "¿Cuál es la diferencia entre...?", "¿Por qué...?", "¿Cómo funciona...?".
  - "answer": la respuesta concisa (1-3 oraciones), basada únicamente en lo que dice el documento. No inventes datos, cifras ni conceptos que no estén en el texto.

Cubre los conceptos más importantes del documento sin repetir la misma idea en varias tarjetas. Si el documento es muy corto y no da para 8 tarjetas, genera las que tengan sentido (mínimo 3) en vez de inventar contenido de relleno.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "topic": "string",
  "cards": [{ "question": "string", "answer": "string" }, ...]
}

Documento:
"""
${truncated}
"""`;
}
