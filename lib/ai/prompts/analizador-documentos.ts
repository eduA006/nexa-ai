import { z } from "zod";

export const personEntrySchema = z.object({
  name: z.string(),
  role: z.string(),
});

export const obligationEntrySchema = z.object({
  party: z.string(),
  description: z.string(),
});

export const analizadorDocumentosAiResultSchema = z.object({
  people: z.array(personEntrySchema).max(15),
  obligations: z.array(obligationEntrySchema).max(15),
});

export type AnalizadorDocumentosAiResult = z.infer<typeof analizadorDocumentosAiResultSchema>;

const MAX_CHARS = 14000;

export function buildAnalizadorDocumentosPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  return `Eres un asistente que extrae información factual de un documento (contrato, acuerdo, propuesta u otro documento profesional) en español.

Extrae ÚNICAMENTE lo que el texto dice explícitamente, de forma neutral:
- "people": personas o partes mencionadas en el documento con su rol (ej. "Arrendador", "Cliente", "Proveedor", "Representante legal"). No inventes personas que no estén mencionadas.
- "obligations": obligaciones o compromisos concretos que el documento asigna a cada parte (ej. "El arrendatario debe pagar el día 5 de cada mes"), citando de forma breve y neutral qué debe hacer cada parte según el texto.

IMPORTANTE: No emitas juicios legales, no evalúes si una cláusula es riesgosa, injusta o desfavorable, no des consejos legales de ningún tipo — solo extrae y resume lo que el documento dice. La evaluación legal la debe hacer un profesional humano.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "people": [{ "name": "string", "role": "string" }],
  "obligations": [{ "party": "string", "description": "string" }]
}

Si no se detectan personas u obligaciones claras, devuelve arreglos vacíos.

Documento:
"""
${truncated}
"""`;
}
