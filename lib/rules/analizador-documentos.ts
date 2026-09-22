/**
 * Extracción determinista de fechas y montos por patrones de texto.
 * Personas/partes y obligaciones requieren comprensión semántica del
 * contenido — eso lo cubre la IA (`lib/ai/prompts/analizador-documentos.ts`).
 */

const DATE_PATTERNS = [
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
  /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
  /\b\d{4}-\d{1,2}-\d{1,2}\b/g,
  /\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4}\b/gi,
];

const AMOUNT_PATTERNS = [
  /(?:\$|USD|MXN|EUR|€)\s?\d[\d.,]*\b/g,
  /\b\d[\d.,]*\s?(?:dólares|pesos|euros)\b/gi,
  /\b\d[\d.,]*\s?%/g,
];

function extractUnique(text: string, patterns: RegExp[]): string[] {
  const found = new Set<string>();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      found.add(match[0].trim());
    }
  }
  return Array.from(found);
}

export type ExtractedFactsResult = {
  dates: string[];
  amounts: string[];
};

export function extractDocumentFacts(text: string): ExtractedFactsResult {
  return {
    dates: extractUnique(text, DATE_PATTERNS),
    amounts: extractUnique(text, AMOUNT_PATTERNS),
  };
}
