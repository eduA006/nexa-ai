import type { RuleFinding } from "@/lib/rules/types";

/**
 * Comparación de citas en el texto contra la lista de referencias.
 * 100% determinista, sin IA: si una cita tiene o no una referencia
 * correspondiente es un hecho verificable por texto, no un juicio de
 * calidad — usar un modelo de lenguaje aquí solo añadiría
 * incertidumbre a algo que ya se puede resolver con certeza (dentro de
 * los límites de lo que el análisis de texto puede reconocer; ver
 * disclaimer en la UI sobre formatos de cita no estándar).
 */

const CONNECTOR_WORDS = new Set(["Et", "Al", "Y", "And", "De", "Del", "La", "Los", "Las"]);

type Citation = { authorTokens: string[]; year: string; raw: string };
type ReferenceEntry = { authorTokens: string[]; year: string; raw: string };

function extractCapitalizedTokens(str: string): string[] {
  const matches = str.match(/\b\p{Lu}\p{Ll}+\b/gu) ?? [];
  return matches.filter((token) => !CONNECTOR_WORDS.has(token));
}

const PARENTHETICAL_CITATION_REGEX =
  /\(([^()]*?,\s*(?:\d{4}[a-z]?|s\.f\.)(?:\s*;\s*[^()]*?,\s*(?:\d{4}[a-z]?|s\.f\.))*)\)/gu;

const NARRATIVE_CITATION_REGEX =
  /\b(\p{Lu}\p{Ll}+(?:\s+(?:&|y|and)\s+\p{Lu}\p{Ll}+)?(?:\s+et al\.)?)\s*\((\d{4}[a-z]?|s\.f\.)\)/gu;

export function extractInTextCitations(bodyText: string): Citation[] {
  const citations: Citation[] = [];

  for (const match of bodyText.matchAll(PARENTHETICAL_CITATION_REGEX)) {
    const group = match[1];
    for (const piece of group.split(";")) {
      const pieceMatch = piece.trim().match(/^(.*?),\s*(\d{4}[a-z]?|s\.f\.)$/);
      if (!pieceMatch) continue;
      const authorTokens = extractCapitalizedTokens(pieceMatch[1]);
      if (authorTokens.length === 0) continue;
      citations.push({ authorTokens, year: pieceMatch[2], raw: `(${piece.trim()})` });
    }
  }

  for (const match of bodyText.matchAll(NARRATIVE_CITATION_REGEX)) {
    const authorTokens = extractCapitalizedTokens(match[1]);
    if (authorTokens.length === 0) continue;
    citations.push({ authorTokens, year: match[2], raw: `${match[1]} (${match[2]})` });
  }

  return citations;
}

export function extractReferenceEntries(referencesText: string): ReferenceEntry[] {
  const lines = referencesText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 15);

  const entries: ReferenceEntry[] = [];
  for (const line of lines) {
    const yearMatch = line.match(/\((\d{4}[a-z]?|s\.f\.)\)/);
    if (!yearMatch) continue;
    const authorSegment = line.slice(0, yearMatch.index);
    const authorTokens = extractCapitalizedTokens(authorSegment);
    if (authorTokens.length === 0) continue;
    entries.push({ authorTokens, year: yearMatch[1], raw: line });
  }
  return entries;
}

function citationMatchesReference(citation: Citation, reference: ReferenceEntry): boolean {
  if (citation.year.toLowerCase() !== reference.year.toLowerCase()) return false;
  return citation.authorTokens.some((token) =>
    reference.authorTokens.some((refToken) => refToken.toLowerCase() === token.toLowerCase()),
  );
}

function findReferencesHeadingIndex(paragraphs: string): number {
  const match = paragraphs.match(/^\s*(referencias|references)\s*$/im);
  return match ? (match.index ?? -1) : -1;
}

export type BibliografiaRuleResult = {
  findings: RuleFinding[];
  score: number;
  citationCount: number;
  referenceCount: number;
};

export function runBibliografiaRules(fullText: string): BibliografiaRuleResult {
  const headingIndex = findReferencesHeadingIndex(fullText);

  if (headingIndex === -1) {
    return {
      findings: [
        {
          type: "Sección de referencias",
          severity: "error",
          location: "Documento completo",
          description: 'No se encontró una sección "Referencias" en el documento.',
          recommendation: 'Agrega una sección "Referencias" al final del documento con el listado en formato APA 7.',
        },
      ],
      score: 0,
      citationCount: 0,
      referenceCount: 0,
    };
  }

  const bodyText = fullText.slice(0, headingIndex);
  const referencesText = fullText.slice(headingIndex);

  const citations = extractInTextCitations(bodyText);
  const references = extractReferenceEntries(referencesText);

  const findings: RuleFinding[] = [];

  const uniqueCitations = new Map<string, Citation>();
  for (const citation of citations) {
    const key = `${citation.authorTokens.join("+").toLowerCase()}|${citation.year.toLowerCase()}`;
    if (!uniqueCitations.has(key)) uniqueCitations.set(key, citation);
  }

  for (const citation of uniqueCitations.values()) {
    const hasMatch = references.some((ref) => citationMatchesReference(citation, ref));
    if (!hasMatch) {
      findings.push({
        type: "Cita sin referencia",
        severity: "error",
        location: citation.raw,
        description: `La cita ${citation.raw} no tiene una entrada correspondiente en la sección de referencias.`,
        recommendation: "Agrega la referencia completa correspondiente, o corrige la cita si el autor/año no coincide.",
      });
    }
  }

  for (const reference of references) {
    const isCited = Array.from(uniqueCitations.values()).some((citation) =>
      citationMatchesReference(citation, reference),
    );
    if (!isCited) {
      findings.push({
        type: "Referencia no citada",
        severity: "warning",
        location: reference.raw.slice(0, 60) + (reference.raw.length > 60 ? "…" : ""),
        description: `La referencia "${reference.raw.slice(0, 80)}${reference.raw.length > 80 ? "…" : ""}" no parece estar citada en el cuerpo del texto.`,
        recommendation: "Cita esta fuente en el texto, o elimínala si no se usó.",
      });
    }
  }

  if (citations.length === 0) {
    findings.push({
      type: "Citas",
      severity: "info",
      location: "Documento completo",
      description: "No se detectaron citas en formato (Autor, Año) en el cuerpo del texto.",
      recommendation: "Verifica manualmente si el documento debería tener citas y no se reconoció el formato.",
    });
  }

  if (references.length === 0) {
    findings.push({
      type: "Referencias",
      severity: "error",
      location: "Sección de referencias",
      description: 'Se encontró el encabezado "Referencias" pero no se pudo extraer ninguna entrada con el formato "Autor (Año)".',
      recommendation: "Verifica que cada referencia esté en su propio párrafo y siga el formato APA 7.",
    });
  }

  const errorCount = findings.filter((f) => f.severity === "error").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 15 - warningCount * 5);

  return { findings, score, citationCount: uniqueCitations.size, referenceCount: references.length };
}
