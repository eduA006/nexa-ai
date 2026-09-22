import type { RuleFinding } from "@/lib/rules/types";

/**
 * Heurísticas deterministas sobre patrones de estilo (variedad de
 * oraciones, diversidad léxica, repetición, muletillas académicas).
 *
 * IMPORTANTE: esto NO es un detector de texto generado por IA. Ningún
 * método basado en estas señales superficiales puede determinar con
 * certeza el origen de un texto — se presentan como indicadores de
 * estilo a revisar, nunca como una acusación o certificación. Ver
 * disclaimer obligatorio en la UI (`WritingForm`).
 */

const MIN_WORDS_FOR_DIVERSITY_CHECK = 150;
const LEXICAL_DIVERSITY_THRESHOLD = 0.35;
const MIN_SENTENCES_FOR_VARIETY_CHECK = 8;
const SENTENCE_VARIETY_CV_THRESHOLD = 0.25;

const FILLER_PHRASES = [
  "cabe destacar",
  "cabe resaltar",
  "cabe mencionar",
  "es importante destacar",
  "es importante mencionar",
  "es importante señalar",
  "es relevante señalar",
  "es fundamental",
  "en este sentido",
  "en esa misma línea",
  "por otro lado",
  "de igual manera",
  "de igual forma",
  "a lo largo de",
  "hoy en día",
  "en la actualidad",
  "en resumen",
  "en conclusión",
  "en definitiva",
];

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function tokenizeWords(text: string): string[] {
  return (text.toLowerCase().match(/\p{L}+/gu) ?? []).filter((w) => w.length > 1);
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  const variance = mean(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

export function checkSentenceVariety(sentences: string[]): RuleFinding[] {
  if (sentences.length < MIN_SENTENCES_FOR_VARIETY_CHECK) return [];

  const lengths = sentences.map((s) => tokenizeWords(s).length).filter((n) => n > 0);
  if (lengths.length < MIN_SENTENCES_FOR_VARIETY_CHECK) return [];

  const avg = mean(lengths);
  const cv = avg > 0 ? stdDev(lengths, avg) / avg : 0;

  if (cv >= SENTENCE_VARIETY_CV_THRESHOLD) return [];

  return [
    {
      type: "Variedad de oraciones",
      severity: "info",
      location: "Documento completo",
      description: `Las oraciones tienen una longitud muy uniforme (promedio ${avg.toFixed(1)} palabras, variación baja). Esto es solo un indicador de estilo, no una prueba de nada.`,
      recommendation: "Combina oraciones cortas y largas para dar ritmo natural al texto.",
    },
  ];
}

export function checkLexicalDiversity(text: string): RuleFinding[] {
  const words = tokenizeWords(text);
  if (words.length < MIN_WORDS_FOR_DIVERSITY_CHECK) return [];

  const uniqueRatio = new Set(words).size / words.length;
  if (uniqueRatio >= LEXICAL_DIVERSITY_THRESHOLD) return [];

  return [
    {
      type: "Diversidad léxica",
      severity: "warning",
      location: "Documento completo",
      description: `El vocabulario se repite bastante a lo largo del texto (${Math.round(uniqueRatio * 100)}% de palabras distintas sobre el total).`,
      recommendation: "Usa sinónimos y varía las construcciones para evitar repetir las mismas palabras.",
    },
  ];
}

export function checkRepeatedSentences(sentences: string[]): RuleFinding[] {
  const seen = new Map<string, number>();
  sentences.forEach((s) => {
    const normalized = s.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalized.length < 20) return; // ignora frases triviales/cortas
    seen.set(normalized, (seen.get(normalized) ?? 0) + 1);
  });

  const repeated = Array.from(seen.entries()).filter(([, count]) => count > 1);
  if (repeated.length === 0) return [];

  return [
    {
      type: "Oraciones repetidas",
      severity: "warning",
      location: `${repeated.length} oración${repeated.length > 1 ? "es" : ""}`,
      description: `Se encontraron ${repeated.length} oración${repeated.length > 1 ? "es" : ""} que se repite${repeated.length > 1 ? "n" : ""} de forma casi idéntica en el documento.`,
      recommendation: "Revisa si esas repeticiones son intencionales o si conviene reformular.",
    },
  ];
}

export function checkFillerPhrases(text: string): RuleFinding[] {
  const lower = text.toLowerCase();
  const found: { phrase: string; count: number }[] = [];

  for (const phrase of FILLER_PHRASES) {
    const count = lower.split(phrase).length - 1;
    if (count > 0) found.push({ phrase, count });
  }

  const totalCount = found.reduce((sum, f) => sum + f.count, 0);
  if (totalCount < 3) return [];

  const examples = found
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((f) => `"${f.phrase}" (${f.count}×)`)
    .join(", ");

  return [
    {
      type: "Muletillas académicas",
      severity: "info",
      location: "Documento completo",
      description: `Se detectaron ${totalCount} usos de frases de relleno comunes en redacción académica genérica, ej.: ${examples}.`,
      recommendation: "Reduce el uso de frases de transición genéricas; prioriza conectores variados y directos.",
    },
  ];
}

/** Ejecuta todas las reglas deterministas de estilo sobre el texto plano del documento. */
export function runWritingRules(text: string): RuleFinding[] {
  const sentences = splitSentences(text);
  return [
    ...checkSentenceVariety(sentences),
    ...checkLexicalDiversity(text),
    ...checkRepeatedSentences(sentences),
    ...checkFillerPhrases(text),
  ];
}
