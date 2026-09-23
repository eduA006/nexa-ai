import "server-only";
import mammoth from "mammoth";
import { generateStructured } from "@/lib/ai/service";
import {
  contractRiskResultSchema,
  buildContractRiskPrompt,
  type ContractClauseFlag,
} from "@/lib/ai/prompts/riesgos-contratos";

export type ContractRiskAnalysis = {
  summary: string;
  flags: ContractClauseFlag[];
  missingClauses: string[];
  provider: string;
  model: string;
  tokensUsed: number | null;
};

/**
 * 100% análisis por IA (no hay regla determinista posible para "qué tan
 * típica es una cláusula") — la contención ética vive en el prompt
 * (nunca "legal/ilegal", solo desviación de prácticas comunes) y en el
 * disclaimer obligatorio de la UI, no en esta capa.
 */
export async function analyzeContractRisk(buffer: Buffer): Promise<ContractRiskAnalysis> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const { data, result } = await generateStructured(
    buildContractRiskPrompt(plainText),
    contractRiskResultSchema,
    { system: "Eres un asistente que identifica redacción contractual atípica, sin dar asesoría legal." },
  );

  return {
    summary: data.summary,
    flags: data.flags,
    missingClauses: data.missingClauses,
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
