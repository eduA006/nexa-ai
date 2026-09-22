import "server-only";
import mammoth from "mammoth";
import { runBibliografiaRules, type BibliografiaRuleResult } from "@/lib/rules/bibliografia";

/**
 * Sin IA: comparar citas contra referencias es un análisis de texto
 * determinista (ver `lib/rules/bibliografia.ts`), no un juicio de
 * calidad que se beneficie de un modelo de lenguaje.
 */
export async function analyzeBibliografiaDocument(buffer: Buffer): Promise<BibliografiaRuleResult> {
  const { value: plainText } = await mammoth.extractRawText({ buffer });
  return runBibliografiaRules(plainText);
}
