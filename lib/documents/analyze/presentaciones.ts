import "server-only";
import mammoth from "mammoth";
import { generateStructured } from "@/lib/ai/service";
import { presentationResultSchema, buildPresentationPrompt } from "@/lib/ai/prompts/presentaciones";
import type { PresentationResult } from "@/lib/ai/prompts/presentaciones";

export type PresentationAnalysisResult = PresentationResult & {
  provider: string;
  model: string;
  tokensUsed: number | null;
};

/**
 * 100% generativo, igual que "Resumir documento" y "Preparador de
 * exposiciones" — no hay una estructura de diapositivas objetivamente
 * "correcta" que una regla determinista pueda verificar. No genera un
 * archivo .pptx descargable (requeriría una librería no evaluada
 * todavía); produce el contenido estructurado para que el usuario lo
 * traslade a su editor de presentaciones.
 */
export async function analyzePresentationDocument(buffer: Buffer): Promise<PresentationAnalysisResult> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const { data, result } = await generateStructured(
    buildPresentationPrompt(plainText),
    presentationResultSchema,
    { system: "Eres un asistente experto en diseñar presentaciones de diapositivas claras y concisas." },
  );

  return {
    ...data,
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
