import "server-only";
import mammoth from "mammoth";
import { runRedaccionRules } from "@/lib/rules/redaccion";
import type { RuleFinding } from "@/lib/rules/types";
import { generateStructured } from "@/lib/ai/service";
import { redaccionAiResultSchema, buildRedaccionAnalysisPrompt } from "@/lib/ai/prompts/redaccion";

export type RedaccionAnalysisResult = {
  mechanicalFindings: RuleFinding[];
  grammarFindings: RuleFinding[];
  aiSummary: string;
  /** Heurística 0-100 basada solo en reglas mecánicas deterministas. */
  mechanicalScore: number;
  /** Heurística 0-100 basada solo en observaciones de ortografía/gramática de la IA. */
  grammarScore: number;
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
 * Combina reglas mecánicas deterministas (espacios, repeticiones,
 * puntuación pegada, oraciones largas) con corrección de ortografía,
 * gramática, claridad y cohesión asistida por IA — no existe un
 * corrector ortográfico de español instalado en el proyecto, por lo
 * que esa parte depende del modelo de lenguaje.
 */
export async function analyzeRedaccionDocument(buffer: Buffer): Promise<RedaccionAnalysisResult> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const mechanicalFindings = runRedaccionRules(plainText);

  const { data: aiResult, result } = await generateStructured(
    buildRedaccionAnalysisPrompt(plainText),
    redaccionAiResultSchema,
    { system: "Eres un corrector de textos experto en ortografía y gramática del español." },
  );

  return {
    mechanicalFindings,
    grammarFindings: aiResult.findings,
    aiSummary: aiResult.summary,
    mechanicalScore: scoreFrom(mechanicalFindings),
    grammarScore: scoreFrom(aiResult.findings),
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
