import { z } from "zod";

export const apaAiFindingSchema = z.object({
  type: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  location: z.string(),
  description: z.string(),
  recommendation: z.string(),
});

export const apaAiResultSchema = z.object({
  summary: z.string(),
  findings: z.array(apaAiFindingSchema).max(8),
});

export type ApaAiResult = z.infer<typeof apaAiResultSchema>;

const MAX_CHARS = 12000;

export function buildApaAnalysisPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  return `Eres un asistente que evalúa la calidad de redacción académica de un documento en español, pensado para formato APA 7.

No evalúes formato (márgenes, fuente, interlineado, sangría, numeración de página) — eso ya se revisa por separado con reglas automáticas deterministas. Concéntrate únicamente en:
- Coherencia y cohesión del texto.
- Calidad y claridad de los argumentos.
- Problemas de citas que reglas automáticas no pueden detectar (citas incompletas, inconsistencias entre lo citado en el texto y el listado de referencias, uso excesivo de citas textuales largas).
- Recomendaciones contextuales de redacción.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "summary": "resumen breve de 2 a 3 oraciones sobre la calidad general de la redacción",
  "findings": [
    { "type": "string", "severity": "error"|"warning"|"info", "location": "string (ej. 'Párrafo 3' o 'Documento completo')", "description": "string", "recommendation": "string" }
  ]
}

Incluye como máximo 8 elementos en "findings", priorizando los más relevantes. Si no encuentras problemas de este tipo, devuelve un array vacío.

Documento a evaluar:
"""
${truncated}
"""`;
}
