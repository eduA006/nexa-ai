import "server-only";
import mammoth from "mammoth";
import { generateStructured } from "@/lib/ai/service";
import { examResultSchema, buildGenerateExamPrompt, type ExamQuestion } from "@/lib/ai/prompts/examen";

export type ExamGenerationResult = {
  questions: ExamQuestion[];
  provider: string;
  model: string;
  tokensUsed: number | null;
};

/**
 * 100% generativo (como "Resumir documento" y "Flashcards") — no hay un
 * examen "correcto" verificable por reglas deterministas para la etapa
 * de generación. La calificación posterior sí es híbrida: ver
 * lib/tools/examen/actions.ts (opción múltiple = regla determinista,
 * abiertas = IA).
 */
export async function generateExamFromDocument(
  buffer: Buffer,
  exampleExamText: string,
): Promise<ExamGenerationResult> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const { data, result } = await generateStructured(
    buildGenerateExamPrompt(plainText, exampleExamText),
    examResultSchema,
    { system: "Eres un asistente experto en diseñar exámenes de práctica en español, fieles al documento original." },
  );

  return {
    questions: data.questions,
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
