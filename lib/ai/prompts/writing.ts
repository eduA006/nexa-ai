import { z } from "zod";

export const writingAiFindingSchema = z.object({
  type: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  location: z.string(),
  description: z.string(),
  recommendation: z.string(),
});

export const writingAiResultSchema = z.object({
  summary: z.string(),
  findings: z.array(writingAiFindingSchema).max(8),
});

export type WritingAiResult = z.infer<typeof writingAiResultSchema>;

const MAX_CHARS = 12000;

export function buildWritingAnalysisPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  return `Eres un asistente que evalúa el ESTILO de redacción de un texto en español (no gramática ni ortografía, eso lo cubre otra herramienta).

Da observaciones sobre:
- Naturalidad del tono y consistencia de la voz a lo largo del texto.
- Profundidad argumentativa vs. generalidades vacías.
- Variación de estructura entre párrafos (evita sonar como una plantilla repetida).
- Uso genuino de ejemplos/evidencia vs. afirmaciones genéricas sin sustento.

REGLA ESTRICTA: nunca afirmes ni insinúes que el texto "fue generado por IA", "es de una IA", o des un porcentaje de probabilidad de autoría. Eso no es posible de determinar de forma confiable y no es tu tarea. Limítate a describir patrones de estilo observables (ej. "el tono es uniforme y poco variado", NO "esto parece escrito por IA").

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "summary": "resumen breve de 2 a 3 oraciones sobre el estilo general del texto",
  "findings": [
    { "type": "string", "severity": "error"|"warning"|"info", "location": "string (ej. 'Párrafo 2' o 'Documento completo')", "description": "string", "recommendation": "string" }
  ]
}

Incluye como máximo 8 elementos en "findings", priorizando los más relevantes. Si no encuentras observaciones relevantes, devuelve un array vacío.

Texto a evaluar:
"""
${truncated}
"""`;
}
