export type RuleSeverity = "error" | "warning" | "info";

export type RuleFinding = {
  type: string;
  severity: RuleSeverity;
  location: string;
  description: string;
  recommendation: string;
  /** Lista completa de párrafos afectados, cuando aplica (ej. interlineado, sangría). */
  affectedParagraphs?: number[];
};
