import "server-only";
import mammoth from "mammoth";
import { runCvRules } from "@/lib/rules/cv";
import type { RuleFinding } from "@/lib/rules/types";
import { generateStructured } from "@/lib/ai/service";
import { cvAiResultSchema, buildCvAnalysisPrompt } from "@/lib/ai/prompts/cv";

export type CvAnalysisResult = {
  structureFindings: RuleFinding[];
  contentFindings: RuleFinding[];
  aiSummary: string;
  /** Heurística 0-100 basada solo en reglas de estructura deterministas. */
  structureScore: number;
  /** Heurística 0-100 basada solo en observaciones de contenido de la IA. */
  contentScore: number;
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
 * Combina reglas deterministas de estructura (contacto, secciones,
 * extensión, logros cuantificados, formato de fechas) con evaluación de
 * contenido asistida por IA (claridad, impacto de logros, consistencia).
 */
export async function analyzeCvDocument(buffer: Buffer): Promise<CvAnalysisResult> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const structureFindings = runCvRules(plainText);

  const { data: aiResult, result } = await generateStructured(
    buildCvAnalysisPrompt(plainText),
    cvAiResultSchema,
    { system: "Eres un reclutador experto que evalúa CVs en español." },
  );

  return {
    structureFindings,
    contentFindings: aiResult.findings,
    aiSummary: aiResult.summary,
    structureScore: scoreFrom(structureFindings),
    contentScore: scoreFrom(aiResult.findings),
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
