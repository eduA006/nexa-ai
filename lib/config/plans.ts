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

/** Precio y vigencia del pago manual por Yape — no hay cobro recurrente automático. */
export const PRO_PRICE_PEN = 5;
export const PRO_PERIOD_DAYS = 7;

export type PlanFields = { plan?: string | null; pro_expires_at?: string | null } | null | undefined;

/**
 * Pro es un pago manual (Yape) sin renovación automática: `plan` por sí
 * solo no basta, también debe seguir vigente `pro_expires_at`. Sin fecha
 * de expiración (ej. datos legacy) se trata como vigente.
 */
export function hasProAccess(profile: PlanFields): boolean {
  if (!profile || profile.plan !== "pro") return false;
  if (!profile.pro_expires_at) return true;
  return new Date(profile.pro_expires_at).getTime() > Date.now();
}

export function canAccessTool(slug: string, profile: PlanFields): boolean {
  return !isProTool(slug) || hasProAccess(profile);
}
