import "server-only";
import mammoth from "mammoth";
import { parseDocxStructure } from "@/lib/documents/extract/docx";
import { runApaRules, type RuleFinding } from "@/lib/rules/apa";
import { generateStructured } from "@/lib/ai/service";
import { apaAiResultSchema, buildApaAnalysisPrompt } from "@/lib/ai/prompts/apa";

export type ApaAnalysisResult = {
  findings: RuleFinding[];
  aiSummary: string;
  /** Heurística simple 0-100, no una certificación de cumplimiento APA. */
  score: number;
  provider: string;
  model: string;
  tokensUsed: number | null;
};

/**
 * Combina reglas programadas (formato) con evaluación de IA (redacción,
 * coherencia, citas contextuales) sobre un DOCX. Ver docs/AI.md y
 * PLAN.md sección 1.2 (arquitectura híbrida).
 */
export async function analyzeApaDocument(buffer: Buffer): Promise<ApaAnalysisResult> {
  const structure = await parseDocxStructure(buffer);
  const ruleFindings = runApaRules(structure);

  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const { data: aiResult, result } = await generateStructured(
    buildApaAnalysisPrompt(plainText),
    apaAiResultSchema,
    { system: "Eres un asistente académico experto en normas APA 7 y redacción en español." },
  );

  const allFindings = [...ruleFindings, ...aiResult.findings];
  const errorCount = allFindings.filter((f) => f.severity === "error").length;
  const otherCount = allFindings.length - errorCount;
  const score = Math.max(0, 100 - errorCount * 15 - otherCount * 5);

  return {
    findings: allFindings,
    aiSummary: aiResult.summary,
    score,
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
