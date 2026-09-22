import { z } from "zod";

export const summarizeResultSchema = z.object({
  shortSummary: z.string(),
  detailedSummary: z.string(),
  keyPoints: z.array(z.string()).max(10),
  conclusions: z.string(),
});

export type SummarizeResult = z.infer<typeof summarizeResultSchema>;

const MAX_CHARS = 12000;

export function buildSummarizePrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  return `Eres un asistente que resume documentos en español de forma fiel al contenido original, sin agregar información que no esté en el texto.

Genera cuatro salidas distintas a partir del documento:
- "shortSummary": un resumen breve de 2 a 4 oraciones, para alguien que solo tiene 30 segundos.
- "detailedSummary": un resumen detallado de varios párrafos que cubra los puntos principales con más contexto.
- "keyPoints": una lista de hasta 10 ideas clave, cada una una oración corta y autocontenida.
- "conclusions": las conclusiones o cierre del documento, en 1 a 3 oraciones. Si el documento no tiene una conclusión explícita, sintetiza el punto final que se puede inferir del contenido, dejándolo claro (ej. "El documento no presenta una conclusión explícita, pero...").

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "shortSummary": "string",
  "detailedSummary": "string",
  "keyPoints": ["string", ...],
  "conclusions": "string"
}

Documento a resumir:
"""
${truncated}
"""`;
}
