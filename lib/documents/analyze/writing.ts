import "server-only";
import mammoth from "mammoth";
import { runWritingRules } from "@/lib/rules/writing";
import type { RuleFinding } from "@/lib/rules/types";
import { generateStructured } from "@/lib/ai/service";
import { writingAiResultSchema, buildWritingAnalysisPrompt } from "@/lib/ai/prompts/writing";

export type WritingAnalysisResult = {
  styleFindings: RuleFinding[];
  aiFindings: RuleFinding[];
  aiSummary: string;
  /** Heurística 0-100 basada solo en indicadores de estilo deterministas. */
  styleScore: number;
  /** Heurística 0-100 basada solo en observaciones cualitativas de la IA. */
  aiScore: number;
  provider: string;
  model: string;
  tokensUsed: number | null;
};

function scoreFrom(findings: RuleFinding[]): number {
  const errorCount = findings.filter((f) => f.severity === "error").length;
  const otherCount = findings.length - errorCount;
  return Math.max(0, 100 - errorCount * 15 - otherCount * 5);
}

/**
 * Combina heurísticas deterministas de estilo (variedad de oraciones,
 * diversidad léxica, repetición, muletillas) con observaciones
 * cualitativas de IA sobre naturalidad y profundidad argumentativa.
 *
 * NO es un detector de texto generado por IA — ver disclaimer en
 * `lib/rules/writing.ts` y en la UI (`WritingForm`). Son indicadores de
 * estilo a revisar, nunca una certificación de autoría.
 */
export async function analyzeWritingDocument(buffer: Buffer): Promise<WritingAnalysisResult> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const styleFindings = runWritingRules(plainText);

  const { data: aiResult, result } = await generateStructured(
    buildWritingAnalysisPrompt(plainText),
    writingAiResultSchema,
    { system: "Eres un asistente experto en estilo de redacción en español." },
  );

  return {
    styleFindings,
    aiFindings: aiResult.findings,
    aiSummary: aiResult.summary,
    styleScore: scoreFrom(styleFindings),
    aiScore: scoreFrom(aiResult.findings),
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
