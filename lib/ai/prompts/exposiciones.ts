import { z } from "zod";

export const exposicionSectionSchema = z.object({
  section: z.string(),
  points: z.array(z.string()).max(6),
});

export const exposicionQuestionSchema = z.object({
  question: z.string(),
  suggestedAnswer: z.string(),
});

export const exposicionResultSchema = z.object({
  structure: z.array(exposicionSectionSchema).max(8),
  script: z.string(),
  questions: z.array(exposicionQuestionSchema).max(8),
});

export type ExposicionResult = z.infer<typeof exposicionResultSchema>;

const MAX_CHARS = 12000;

export function buildExposicionPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  return `Eres un asistente que ayuda a preparar la exposición oral de un trabajo académico en español, basándote fielmente en el contenido del documento.

Genera tres salidas:
- "structure": entre 4 y 8 secciones para organizar la presentación (ej. Introducción, Contexto, Metodología, Resultados, Conclusión), cada una con hasta 6 puntos clave a mencionar (frases cortas, no párrafos).
- "script": un guion de exposición oral completo y natural (como si la persona fuera a leerlo o memorizarlo), organizado por las mismas secciones, escrito en primera persona ("Voy a hablarles de...", "En segundo lugar..."). No es un resumen del documento, es lo que la persona diría en voz alta al presentar.
- "questions": hasta 8 preguntas que un evaluador o la audiencia podría hacer sobre el contenido, cada una con una respuesta sugerida breve.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "structure": [{ "section": "string", "points": ["string", ...] }],
  "script": "string",
  "questions": [{ "question": "string", "suggestedAnswer": "string" }]
}

Documento base:
"""
${truncated}
"""`;
}
