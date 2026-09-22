import "server-only";
import mammoth from "mammoth";
import { generateStructured } from "@/lib/ai/service";
import { summarizeResultSchema, buildSummarizePrompt } from "@/lib/ai/prompts/summarize";

export type SummarizeAnalysisResult = {
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  conclusions: string;
  provider: string;
  model: string;
  tokensUsed: number | null;
};

/**
 * A diferencia de APA/escritura, resumir un documento no tiene un
 * componente de reglas deterministas que aplicar — no hay un "formato
 * correcto" objetivamente verificable para un resumen. Es 100% generativo,
 * por lo que aquí no se sigue la arquitectura híbrida de PLAN.md 1.2.
 */
export async function analyzeSummarizeDocument(buffer: Buffer): Promise<SummarizeAnalysisResult> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const { data, result } = await generateStructured(
    buildSummarizePrompt(plainText),
    summarizeResultSchema,
    { system: "Eres un asistente experto en sintetizar documentos en español de forma fiel al original." },
  );

  return {
    shortSummary: data.shortSummary,
    detailedSummary: data.detailedSummary,
    keyPoints: data.keyPoints,
    conclusions: data.conclusions,
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
