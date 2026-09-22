import { z } from "zod";

export const correoResultSchema = z.object({
  subject: z.string(),
  body: z.string(),
  notes: z.string(),
});

export type CorreoResult = z.infer<typeof correoResultSchema>;

export type CorreoAction = "redactar" | "mejorar" | "resumir" | "tono";

const MAX_CHARS = 8000;

const ACTION_INSTRUCTIONS: Record<CorreoAction, string> = {
  redactar:
    'El texto de entrada son instrucciones/brief (a quién va dirigido, de qué trata, qué se busca lograr), NO un correo ya escrito. Redacta un correo completo nuevo a partir de esas instrucciones. Llena "subject" con un asunto sugerido y "body" con el correo completo. Deja "notes" vacío.',
  mejorar:
    'El texto de entrada es un correo ya escrito. Mejora su claridad, profesionalismo y gramática sin cambiar su intención ni agregar información que no esté implícita. Pon el correo mejorado en "body", sugiere un "subject" si el original no tenía uno claro, y resume en "notes" qué se cambió.',
  resumir:
    'El texto de entrada es un correo o hilo de correos largo. Resume los puntos clave, decisiones y pendientes en "body" (breve, con viñetas si ayuda a la claridad). Deja "subject" vacío. Deja "notes" vacío.',
  tono: 'El texto de entrada es un correo ya escrito. Reescríbelo en el tono solicitado (indicado abajo) sin cambiar su contenido ni intención. Pon el resultado en "body", conserva el "subject" original si lo había, y describe brevemente en "notes" qué cambió del tono.',
};

export function buildCorreoPrompt(text: string, action: CorreoAction, tone: string): string {
  const truncated = text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n[...truncado por longitud...]` : text;
  const toneInstruction =
    (action === "redactar" || action === "tono") && tone.trim()
      ? `Tono deseado: "${tone.trim()}".`
      : "";

  return `Eres un asistente experto en redacción de correos profesionales en español.

Tarea solicitada: "${action}". ${ACTION_INSTRUCTIONS[action]}
${toneInstruction}

No inventes datos concretos (nombres, fechas, cifras) que no estén en el texto de entrada — si faltan, usa placeholders genéricos como "[nombre]" o "[fecha]".

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "subject": "string",
  "body": "string",
  "notes": "string"
}

Texto de entrada:
"""
${truncated}
"""`;
}
