import { z } from "zod";

export const contractClauseFlagSchema = z.object({
  clause: z.string(),
  category: z.string(),
  deviation: z.enum(["leve", "notable", "significativa"]),
  explanation: z.string(),
});

export const contractRiskResultSchema = z.object({
  summary: z.string(),
  flags: z.array(contractClauseFlagSchema).max(20),
  missingClauses: z.array(z.string()).max(10),
});

export type ContractClauseFlag = z.infer<typeof contractClauseFlagSchema>;
export type ContractRiskResult = z.infer<typeof contractRiskResultSchema>;

const MAX_CHARS = 14000;

export function buildContractRiskPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  return `Eres un asistente que compara un contrato en español contra prácticas contractuales estándar, buscando redacción atípica — NO eres un abogado y no emites juicios legales.

Analiza el documento y produce:
- "summary": descripción neutral y breve del tipo de contrato y las partes involucradas, basada únicamente en lo que dice el texto. Si algo no está claro, usa "No especificado".
- "flags": cláusulas cuya redacción se desvía de prácticas contractuales comunes (ej. ausencia de tope de responsabilidad, renovación automática sin aviso claro, indemnización unilateral, plazos de terminación muy cortos o ausentes, penalidades desproporcionadas, cesión de derechos sin consentimiento). Para cada una:
  - "clause": cita breve o paráfrasis de la cláusula en cuestión.
  - "category": categoría (ej. "Responsabilidad", "Terminación", "Renovación", "Pagos y penalidades", "Confidencialidad", "Propiedad intelectual", "Cesión de derechos", "Otro").
  - "deviation": "leve", "notable" o "significativa" — qué tanto se aleja de la redacción típica de este tipo de cláusula. NUNCA uses esto como sinónimo de "riesgo legal" o "válido/inválido".
  - "explanation": explicación factual y neutral de por qué esta redacción es atípica respecto a prácticas comunes — sin decir si es "legal", "ilegal", "válida", "abusiva" ni dar recomendaciones legales de qué hacer.
- "missingClauses": tipos de cláusulas que suelen esperarse en este tipo de contrato y que no aparecen en el texto (ej. "cláusula de terminación", "límite de responsabilidad", "resolución de disputas"). Si no puedes determinar el tipo de contrato con suficiente confianza, deja este arreglo vacío en vez de adivinar.

IMPORTANTE: No des asesoría legal, no evalúes si el contrato es "riesgoso" en términos legales, no sugieras acciones legales. Limítate a señalar patrones de redacción atípicos y describir por qué se apartan de lo común. La evaluación legal la debe hacer un profesional humano.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "summary": "string",
  "flags": [{ "clause": "string", "category": "string", "deviation": "leve"|"notable"|"significativa", "explanation": "string" }],
  "missingClauses": ["string"]
}

Documento:
"""
${truncated}
"""`;
}
