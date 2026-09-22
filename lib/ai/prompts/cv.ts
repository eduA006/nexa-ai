import { z } from "zod";

export const cvAiFindingSchema = z.object({
  type: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  location: z.string(),
  description: z.string(),
  recommendation: z.string(),
});

export const cvAiResultSchema = z.object({
  summary: z.string(),
  findings: z.array(cvAiFindingSchema).max(10),
});

export type CvAiResult = z.infer<typeof cvAiResultSchema>;

const MAX_CHARS = 12000;

export function buildCvAnalysisPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  return `Eres un reclutador experto que evalúa la calidad de contenido de un CV en español.

No evalúes estructura, presencia de secciones, datos de contacto ni formato de fechas — eso ya se revisa por separado con reglas automáticas. Concéntrate únicamente en:
- Claridad y concisión de la redacción (evita jerga vacía o frases genéricas sin contenido real).
- Impacto real de los logros descritos: ¿describen resultados concretos o solo responsabilidades genéricas? (ej. "responsable del equipo de ventas" vs. "lideré un equipo de 8 personas, superando la meta trimestral en 15%").
- Consistencia de tono y tiempo verbal a lo largo del documento.
- Señales de alerta como vacíos temporales evidentes entre empleos, o descripciones contradictorias.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "summary": "resumen breve de 2 a 3 oraciones sobre la calidad general del contenido del CV",
  "findings": [
    { "type": "string", "severity": "error"|"warning"|"info", "location": "string (ej. 'Experiencia - Empresa X')", "description": "string", "recommendation": "string" }
  ]
}

Incluye como máximo 10 elementos en "findings", priorizando los más relevantes. Si el CV está bien redactado, devuelve un array vacío.

CV a evaluar:
"""
${truncated}
"""`;
}
