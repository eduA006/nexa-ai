import "server-only";
import mammoth from "mammoth";
import { generateStructured } from "@/lib/ai/service";
import { exposicionResultSchema, buildExposicionPrompt } from "@/lib/ai/prompts/exposiciones";
import type { ExposicionResult } from "@/lib/ai/prompts/exposiciones";

export type ExposicionAnalysisResult = ExposicionResult & {
  provider: string;
  model: string;
  tokensUsed: number | null;
};

/**
 * 100% generativo, igual que "Resumir documento" — no hay una
 * estructura de exposición objetivamente "correcta" que una regla
 * determinista pueda verificar.
 */
export async function analyzeExposicionDocument(buffer: Buffer): Promise<ExposicionAnalysisResult> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const { data, result } = await generateStructured(
    buildExposicionPrompt(plainText),
    exposicionResultSchema,
    { system: "Eres un asistente experto en preparar exposiciones orales académicas en español." },
  );

  return {
    ...data,
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
