export type Plan = "free" | "pro";

/**
 * Herramientas que requieren plan Pro. Elegidas por ser las de mayor
 * esfuerzo ahorrado (generan un entregable real) o mayor complejidad de
 * IA: Generador de CV, Generador de documentos, Generador de informes,
 * Analizador de documentos, Analizador de riesgos y contratos, Generador
 * de presentaciones, Simulador de exámenes. El resto del catálogo
 * (incluye Flashcards, Preparador de exposiciones, Chat con documentos,
 * Resumir, Corrector APA, etc.) sigue gratis.
 */
export const PRO_TOOL_SLUGS: ReadonlySet<string> = new Set([
  "generador-cv",
  "documentos",
  "informes",
  "analizador-documentos",
  "riesgos-contratos",
  "presentaciones",
  "examen",
]);

export function isProTool(slug: string): boolean {
  return PRO_TOOL_SLUGS.has(slug);
}

export function hasProAccess(plan: string | null | undefined): boolean {
  return plan === "pro";
}

export function canAccessTool(slug: string, plan: string | null | undefined): boolean {
  return !isProTool(slug) || hasProAccess(plan);
}
