import { z } from "zod";

export const redaccionAiFindingSchema = z.object({
  type: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  location: z.string(),
  description: z.string(),
  recommendation: z.string(),
});

export const redaccionAiResultSchema = z.object({
  summary: z.string(),
  findings: z.array(redaccionAiFindingSchema).max(10),
});

export type RedaccionAiResult = z.infer<typeof redaccionAiResultSchema>;

const MAX_CHARS = 12000;

export function buildRedaccionAnalysisPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  return `Eres un corrector de textos experto en español (ortografía, gramática, claridad y cohesión).

Evalúa el documento en estos aspectos:
- Ortografía: palabras mal escritas, tildes faltantes o mal puestas, uso incorrecto de mayúsculas.
- Gramática: concordancia (género/número), conjugación verbal, uso de preposiciones, puntuación mal aplicada.
- Claridad: frases ambiguas, redundantes o confusas.
- Cohesión: conectores mal usados o ausentes entre ideas, transiciones abruptas entre párrafos.

Para cada hallazgo, cita el fragmento exacto del texto en "description" (entre comillas) y da la corrección específica en "recommendation" (también citando el texto corregido cuando aplique), no solo una explicación genérica.

No repitas hallazgos mecánicos obvios como espacios dobles o palabras repetidas consecutivas — eso ya se revisa aparte con reglas automáticas.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "summary": "resumen breve de 2 a 3 oraciones sobre la calidad general de la redacción",
  "findings": [
    { "type": "string", "severity": "error"|"warning"|"info", "location": "string (ej. 'Párrafo 2')", "description": "string citando el fragmento original", "recommendation": "string con la corrección específica" }
  ]
}

Incluye como máximo 10 elementos en "findings", priorizando los más relevantes. Si el texto está bien escrito, devuelve un array vacío.

Documento a evaluar:
"""
${truncated}
"""`;
}
