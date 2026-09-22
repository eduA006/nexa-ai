import "server-only";
import mammoth from "mammoth";
import { generateStructured } from "@/lib/ai/service";
import { flashcardsResultSchema, buildFlashcardsPrompt } from "@/lib/ai/prompts/flashcards";

export type FlashcardsAnalysisResult = {
  topic: string;
  cards: { question: string; answer: string }[];
  provider: string;
  model: string;
  tokensUsed: number | null;
};

/**
 * 100% generativo, igual que "Resumir documento": no hay un conjunto
 * "correcto" de tarjetas verificable por reglas deterministas, así que
 * no se sigue la arquitectura híbrida de PLAN.md 1.2.
 */
export async function analyzeFlashcardsDocument(buffer: Buffer): Promise<FlashcardsAnalysisResult> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const { data, result } = await generateStructured(
    buildFlashcardsPrompt(plainText),
    flashcardsResultSchema,
    { system: "Eres un asistente experto en crear material de estudio (flashcards) en español, fiel al documento original." },
  );

  return {
    topic: data.topic,
    cards: data.cards,
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
