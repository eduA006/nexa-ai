import type { RuleFinding } from "@/lib/rules/types";

/**
 * Reglas mecánicas deterministas (no requieren un diccionario ni un
 * modelo de lenguaje): espacios dobles, palabras repetidas consecutivas,
 * falta de espacio tras puntuación, y oraciones excesivamente largas.
 * La ortografía y gramática reales (que sí requieren entender el
 * idioma) las cubre la IA en `lib/ai/prompts/redaccion.ts` — no existe
 * en este proyecto un corrector ortográfico de español instalado.
 */

const LONG_SENTENCE_WORD_THRESHOLD = 40;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function checkDoubleSpaces(text: string): RuleFinding[] {
  const matches = text.match(/\S {2,}\S/g) ?? [];
  if (matches.length === 0) return [];

  return [
    {
      type: "Espacios dobles",
      severity: "info",
      location: `${matches.length} ocurrencia${matches.length > 1 ? "s" : ""}`,
      description: `Se detectaron ${matches.length} lugares con más de un espacio entre palabras.`,
      recommendation: "Revisa y deja un solo espacio entre palabras.",
    },
  ];
}

export function checkRepeatedWords(text: string): RuleFinding[] {
  const matches = text.match(/\b(\p{L}+)\s+\1\b/giu) ?? [];
  if (matches.length === 0) return [];

  const examples = Array.from(new Set(matches.map((m) => m.toLowerCase()))).slice(0, 3);

  return [
    {
      type: "Palabras repetidas",
      severity: "warning",
      location: `${matches.length} ocurrencia${matches.length > 1 ? "s" : ""}`,
      description: `Se detectaron palabras repetidas de forma consecutiva, ej.: ${examples.join(", ")}.`,
      recommendation: "Elimina la palabra duplicada; probablemente sea un error de tipeo.",
    },
  ];
}

export function checkMissingSpaceAfterPunctuation(text: string): RuleFinding[] {
  const matches = text.match(/[.,;:!?][\p{L}]/gu) ?? [];
  if (matches.length === 0) return [];

  return [
    {
      type: "Puntuación pegada al texto",
      severity: "warning",
      location: `${matches.length} ocurrencia${matches.length > 1 ? "s" : ""}`,
      description: `Se detectaron ${matches.length} casos donde falta un espacio después de un signo de puntuación.`,
      recommendation: "Agrega un espacio después de comas, puntos y demás signos de puntuación.",
    },
  ];
}

export function checkLongSentences(text: string): RuleFinding[] {
  const sentences = splitSentences(text);
  const offending: number[] = [];

  sentences.forEach((sentence, index) => {
    const wordCount = (sentence.match(/\p{L}+/gu) ?? []).length;
    if (wordCount > LONG_SENTENCE_WORD_THRESHOLD) offending.push(index + 1);
  });

  if (offending.length === 0) return [];

  return [
    {
      type: "Oraciones largas",
      severity: "info",
      location: `${offending.length} oración${offending.length > 1 ? "es" : ""}`,
      description: `${offending.length} oración${offending.length > 1 ? "es tienen" : " tiene"} más de ${LONG_SENTENCE_WORD_THRESHOLD} palabras, lo que puede dificultar la lectura.`,
      recommendation: "Considera dividir las oraciones largas en dos o más oraciones cortas.",
      affectedParagraphs: offending,
    },
  ];
}

/** Ejecuta todas las reglas mecánicas deterministas sobre el texto plano. */
export function runRedaccionRules(text: string): RuleFinding[] {
  return [
    ...checkDoubleSpaces(text),
    ...checkRepeatedWords(text),
    ...checkMissingSpaceAfterPunctuation(text),
    ...checkLongSentences(text),
  ];
}
