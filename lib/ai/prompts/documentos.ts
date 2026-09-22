import { z } from "zod";

export const documentoSectionSchema = z.object({
  heading: z.string(),
  content: z.string(),
});

export const documentoResultSchema = z.object({
  title: z.string(),
  sections: z.array(documentoSectionSchema).max(12),
});

export type DocumentoResult = z.infer<typeof documentoResultSchema>;

export type DocumentoType = "informe" | "memorando" | "carta" | "propuesta";

const TYPE_LABELS: Record<DocumentoType, string> = {
  informe: "informe",
  memorando: "memorando",
  carta: "carta formal",
  propuesta: "propuesta",
};

const TYPE_GUIDANCE: Record<DocumentoType, string> = {
  informe:
    'Estructura en secciones con encabezado (ej. "Introducción", "Desarrollo", "Conclusiones/Recomendaciones"). Tono objetivo y estructurado.',
  memorando:
    'Formato de memorando: puede usar una sección inicial sin encabezado con los datos de cabecera (Para / De / Fecha / Asunto, usando lo que el usuario haya dado; deja placeholders como "[fecha]" si falta un dato), seguida de secciones breves si el contenido lo amerita. Tono directo y conciso.',
  carta: 'Formato de carta formal: saludo, cuerpo, despedida. Generalmente basta con una sola sección sin encabezado.',
  propuesta:
    'Estructura en secciones con encabezado (ej. "Antecedentes", "Objetivo", "Alcance", "Cronograma o Presupuesto" si aplica, "Conclusión"). Tono persuasivo pero profesional.',
};

const MAX_CHARS = 6000;

export function buildDocumentoPrompt(type: DocumentoType, instructions: string): string {
  const truncated =
    instructions.length > MAX_CHARS ? `${instructions.slice(0, MAX_CHARS)}\n[...truncado...]` : instructions;

  return `Eres un asistente experto en redactar documentos profesionales en español.

Tipo de documento solicitado: ${TYPE_LABELS[type]}.
${TYPE_GUIDANCE[type]}

No inventes datos concretos (nombres, cifras, fechas, empresas) que no estén en las instrucciones del usuario — usa placeholders genéricos como "[nombre]" o "[fecha]" cuando falte un dato necesario para el formato.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "title": "string (título del documento)",
  "sections": [{ "heading": "string (puede ser vacío si no aplica un encabezado)", "content": "string (uno o más párrafos, separados por \\n\\n si hay varios)" }]
}

Instrucciones del usuario:
"""
${truncated}
"""`;
}
