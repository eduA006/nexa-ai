import { z } from "zod";

export const examQuestionSchema = z.object({
  type: z.enum(["multiple_choice", "open"]),
  question: z.string(),
  /** Solo para "multiple_choice" — entre 3 y 5 opciones. Vacío para "open". */
  options: z.array(z.string()).max(5),
  /** Solo para "multiple_choice" — índice (0-based) de la opción correcta. -1 para "open". */
  correctIndex: z.number(),
  /** Respuesta modelo/esperada. Para "open" se usa para calificar; para
   * "multiple_choice" es una breve explicación de por qué esa opción es correcta. */
  referenceAnswer: z.string(),
});

export const examResultSchema = z.object({
  questions: z.array(examQuestionSchema).min(5).max(15),
});

export type ExamQuestion = z.infer<typeof examQuestionSchema>;
export type ExamResult = z.infer<typeof examResultSchema>;

const MAX_CHARS = 12000;
const MAX_EXAMPLE_CHARS = 4000;

export function buildGenerateExamPrompt(documentText: string, exampleExamText: string): string {
  const truncatedDoc =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  const exampleSection = exampleExamText.trim()
    ? `El usuario proporcionó ejemplos de exámenes anteriores sobre este tema — imita su formato, estilo y nivel de dificultad tanto como sea razonable, pero las preguntas deben basarse en el contenido del documento, no en los ejemplos:
"""
${exampleExamText.trim().slice(0, MAX_EXAMPLE_CHARS)}
"""`
    : "";

  return `Eres un asistente que diseña exámenes de práctica en español a partir de un documento de estudio.

Genera entre 5 y 15 preguntas que evalúen comprensión real del contenido (no solo memorización literal), mezclando dos tipos:
- "multiple_choice": pregunta con 3 a 5 opciones ("options"), una sola correcta ("correctIndex", índice 0-based), y una breve explicación en "referenceAnswer" de por qué esa opción es correcta.
- "open": pregunta de desarrollo corto (1-3 oraciones esperadas). Deja "options" como arreglo vacío y "correctIndex" en -1. En "referenceAnswer" pon la respuesta modelo completa que se usará para calificar — esta respuesta NUNCA se le muestra al usuario antes de responder.

Usa una mezcla razonable de ambos tipos (aproximadamente mitad y mitad). Basa cada pregunta únicamente en información que aparece en el documento — no inventes datos, cifras ni conceptos ajenos al texto.

${exampleSection}

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "questions": [
    { "type": "multiple_choice"|"open", "question": "string", "options": ["string", ...], "correctIndex": number, "referenceAnswer": "string" }
  ]
}

Documento:
"""
${truncatedDoc}
"""`;
}

export const openAnswerGradingSchema = z.object({
  results: z.array(
    z.object({
      correct: z.boolean(),
      feedback: z.string(),
    }),
  ),
});

export type OpenAnswerGrading = z.infer<typeof openAnswerGradingSchema>;

export function buildGradeOpenAnswersPrompt(
  items: { question: string; referenceAnswer: string; userAnswer: string }[],
): string {
  const list = items
    .map(
      (item, index) =>
        `${index + 1}. Pregunta: ${item.question}\nRespuesta esperada: ${item.referenceAnswer}\nRespuesta del estudiante: ${item.userAnswer || "(sin responder)"}`,
    )
    .join("\n\n");

  return `Eres un asistente que califica respuestas abiertas de examen en español, comparando la respuesta del estudiante contra la respuesta esperada.

Para cada pregunta, evalúa si la respuesta del estudiante captura la idea correcta de la respuesta esperada — no exijas las mismas palabras exactas, acepta paráfrasis válidas y respuestas parcialmente correctas solo si cubren el punto central. Marca "correct": false si la respuesta está vacía, es incorrecta, o es demasiado vaga para demostrar comprensión real. En "feedback" da una retroalimentación breve y específica (1-2 oraciones), constructiva, explicando qué faltó o confirmando qué estuvo bien.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta, con exactamente ${items.length} elementos en "results" en el mismo orden:
{
  "results": [{ "correct": boolean, "feedback": "string" }, ...]
}

Preguntas a calificar:
${list}`;
}
