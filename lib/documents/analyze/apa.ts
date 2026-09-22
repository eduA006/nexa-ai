import "server-only";
import mammoth from "mammoth";
import { parseDocxStructure } from "@/lib/documents/extract/docx";
import { runApaRules, type RuleFinding } from "@/lib/rules/apa";
import { generateStructured } from "@/lib/ai/service";
import { apaAiResultSchema, buildApaAnalysisPrompt } from "@/lib/ai/prompts/apa";

export type ApaAnalysisResult = {
  formatFindings: RuleFinding[];
  writingFindings: RuleFinding[];
  aiSummary: string;
  /** Heurística 0-100 basada solo en reglas de formato deterministas. */
  formatScore: number;
  /** Heurística 0-100 basada solo en observaciones de redacción de la IA. */
  writingScore: number;
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
 * Combina reglas programadas (formato) con evaluación de IA (redacción,
 * coherencia, citas contextuales) sobre un DOCX. Ver docs/AI.md y
 * PLAN.md sección 1.2 (arquitectura híbrida).
 *
 * Formato y redacción se puntúan por separado: son evaluaciones de
 * naturaleza distinta (objetiva/determinista vs. subjetiva/asistida
 * por IA) y mezclarlas en un solo número resulta engañoso — un
 * documento con formato perfecto pero observaciones de redacción no
 * debería leerse como "está mal" en un puntaje único.
 */
export async function analyzeApaDocument(buffer: Buffer): Promise<ApaAnalysisResult> {
  const structure = await parseDocxStructure(buffer);
  const formatFindings = runApaRules(structure);

  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const { data: aiResult, result } = await generateStructured(
    buildApaAnalysisPrompt(plainText),
    apaAiResultSchema,
    { system: "Eres un asistente académico experto en normas APA 7 y redacción en español." },
  );

  return {
    formatFindings,
    writingFindings: aiResult.findings,
    aiSummary: aiResult.summary,
    formatScore: scoreFrom(formatFindings),
    writingScore: scoreFrom(aiResult.findings),
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
