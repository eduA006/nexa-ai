import "server-only";
import mammoth from "mammoth";
import { extractDocumentFacts } from "@/lib/rules/analizador-documentos";
import { generateStructured } from "@/lib/ai/service";
import {
  analizadorDocumentosAiResultSchema,
  buildAnalizadorDocumentosPrompt,
} from "@/lib/ai/prompts/analizador-documentos";
import type { AnalizadorDocumentosAiResult } from "@/lib/ai/prompts/analizador-documentos";

export type AnalizadorDocumentosResult = AnalizadorDocumentosAiResult & {
  dates: string[];
  amounts: string[];
  provider: string;
  model: string;
  tokensUsed: number | null;
};

/**
 * Fechas y montos son extracción determinista por patrones de texto
 * (`lib/rules/analizador-documentos.ts`); personas y obligaciones
 * requieren comprensión semántica y las extrae la IA, sin emitir
 * juicios legales — ver disclaimer obligatorio en la UI.
 */
export async function analyzeDocumentFacts(buffer: Buffer): Promise<AnalizadorDocumentosResult> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });

  const { dates, amounts } = extractDocumentFacts(plainText);

  const { data, result } = await generateStructured(
    buildAnalizadorDocumentosPrompt(plainText),
    analizadorDocumentosAiResultSchema,
    { system: "Eres un asistente que extrae información factual de documentos, sin dar asesoría legal." },
  );

  return {
    dates,
    amounts,
    people: data.people,
    obligations: data.obligations,
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
