import type { RuleFinding } from "@/lib/rules/types";

/**
 * Reglas deterministas sobre estructura y datos objetivamente
 * verificables de un CV. La calidad de la redacción, el impacto real
 * de los logros descritos y la consistencia de tono los evalúa la IA
 * (`lib/ai/prompts/cv.ts`) — eso sí requiere criterio, no es un patrón
 * de texto verificable.
 */

const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/;

const SECTION_KEYWORDS: Record<string, string[]> = {
  Experiencia: ["experiencia", "experiencia laboral", "trayectoria profesional", "experience"],
  Educación: ["educación", "formación académica", "formación", "estudios", "education"],
  Habilidades: ["habilidades", "competencias", "aptitudes", "skills"],
};

const MIN_WORD_COUNT = 150;
const MAX_WORD_COUNT = 1200;
const MIN_QUANTIFIED_RATIO_PER_100_WORDS = 0.3;

function countWords(text: string): number {
  return (text.match(/\p{L}+/gu) ?? []).length;
}

export function checkContactInfo(text: string): RuleFinding[] {
  const findings: RuleFinding[] = [];

  if (!EMAIL_REGEX.test(text)) {
    findings.push({
      type: "Información de contacto",
      severity: "error",
      location: "Documento completo",
      description: "No se detectó una dirección de correo electrónico en el CV.",
      recommendation: "Agrega tu correo electrónico, idealmente cerca del encabezado.",
    });
  }

  if (!PHONE_REGEX.test(text)) {
    findings.push({
      type: "Información de contacto",
      severity: "warning",
      location: "Documento completo",
      description: "No se detectó un número de teléfono en el CV.",
      recommendation: "Considera agregar un número de contacto.",
    });
  }

  return findings;
}

export function checkCommonSections(text: string): RuleFinding[] {
  const lower = text.toLowerCase();
  const missing = Object.entries(SECTION_KEYWORDS)
    .filter(([, keywords]) => !keywords.some((k) => lower.includes(k)))
    .map(([section]) => section);

  if (missing.length === 0) return [];

  return [
    {
      type: "Estructura",
      severity: "warning",
      location: "Documento completo",
      description: `No se detectaron secciones claras para: ${missing.join(", ")}.`,
      recommendation: "Organiza el CV con encabezados claros para cada sección (ej. 'Experiencia', 'Educación', 'Habilidades').",
    },
  ];
}

export function checkLength(text: string): RuleFinding[] {
  const wordCount = countWords(text);

  if (wordCount < MIN_WORD_COUNT) {
    return [
      {
        type: "Extensión",
        severity: "warning",
        location: "Documento completo",
        description: `El CV tiene aproximadamente ${wordCount} palabras, lo que parece muy breve para transmitir experiencia y logros.`,
        recommendation: "Amplía las descripciones de experiencia y logros con más detalle y contexto.",
      },
    ];
  }

  if (wordCount > MAX_WORD_COUNT) {
    return [
      {
        type: "Extensión",
        severity: "info",
        location: "Documento completo",
        description: `El CV tiene aproximadamente ${wordCount} palabras, lo que podría exceder la extensión recomendada (1-2 páginas).`,
        recommendation: "Considera resumir o eliminar información menos relevante para mantenerlo conciso.",
      },
    ];
  }

  return [];
}

export function checkQuantifiedAchievements(text: string): RuleFinding[] {
  const wordCount = countWords(text);
  if (wordCount < MIN_WORD_COUNT) return [];

  const numberMatches = text.match(/\d+([.,]\d+)?%?/g) ?? [];
  const ratio = (numberMatches.length / wordCount) * 100;

  if (ratio >= MIN_QUANTIFIED_RATIO_PER_100_WORDS) return [];

  return [
    {
      type: "Logros cuantificados",
      severity: "info",
      location: "Documento completo",
      description: "Se detectaron pocos números o porcentajes en el texto, lo que sugiere que los logros podrían no estar cuantificados.",
      recommendation: 'Agrega métricas concretas a tus logros (ej. "aumenté las ventas en un 20%" en vez de "mejoré las ventas").',
    },
  ];
}

const DATE_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "MM/AAAA", regex: /\b\d{1,2}\/\d{4}\b/g },
  { name: "Mes AAAA", regex: /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+\d{4}\b/gi },
  { name: "AAAA-AAAA", regex: /\b\d{4}\s*-\s*\d{4}\b/g },
  { name: "AAAA solo", regex: /\b\d{4}\b/g },
];

export function checkDateFormatConsistency(text: string): RuleFinding[] {
  const usedPatterns = DATE_PATTERNS.filter((p) => p.regex.test(text)).map((p) => p.name);

  // "AAAA solo" es un subconjunto de cualquier otro patrón que contenga
  // años; solo cuenta como formato distinto si es el único detectado.
  const meaningfulPatterns = usedPatterns.length > 1 ? usedPatterns.filter((p) => p !== "AAAA solo") : usedPatterns;

  if (meaningfulPatterns.length <= 1) return [];

  return [
    {
      type: "Formato de fechas",
      severity: "info",
      location: "Documento completo",
      description: `Se detectaron múltiples formatos de fecha distintos en el documento (${meaningfulPatterns.join(", ")}).`,
      recommendation: "Usa un formato de fecha consistente en todo el CV (ej. siempre 'Mes AAAA').",
    },
  ];
}

/** Ejecuta todas las reglas deterministas de estructura sobre el texto plano del CV. */
export function runCvRules(text: string): RuleFinding[] {
  return [
    ...checkContactInfo(text),
    ...checkCommonSections(text),
    ...checkLength(text),
    ...checkQuantifiedAchievements(text),
    ...checkDateFormatConsistency(text),
  ];
}
