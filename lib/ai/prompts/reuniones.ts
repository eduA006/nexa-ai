import { z } from "zod";

export const actionItemSchema = z.object({
  task: z.string(),
  owner: z.string(),
  dueDate: z.string(),
});

export const reunionResultSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()).max(10),
  actionItems: z.array(actionItemSchema).max(15),
  keyPoints: z.array(z.string()).max(10),
});

export type ReunionResult = z.infer<typeof reunionResultSchema>;

const MAX_CHARS = 14000;

export function buildReunionPrompt(text: string): string {
  const truncated = text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n[...truncado por longitud...]` : text;

  return `Eres un asistente que extrae información estructurada de una transcripción o notas de una reunión, en español.

Extrae:
- "summary": resumen breve de 2 a 4 oraciones sobre de qué trató la reunión.
- "decisions": decisiones concretas que se tomaron (no discusiones sin resolver).
- "actionItems": tareas pendientes, cada una con "task" (qué hay que hacer), "owner" (quién es responsable) y "dueDate" (fecha límite). Si el responsable o la fecha no se mencionan explícitamente en el texto, usa el valor "No especificado" — NO inventes un nombre ni una fecha.
- "keyPoints": otros puntos relevantes discutidos que no son decisiones ni tareas (contexto, opiniones importantes, riesgos mencionados).

No inventes participantes, decisiones ni tareas que no estén en el texto.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "summary": "string",
  "decisions": ["string", ...],
  "actionItems": [{ "task": "string", "owner": "string", "dueDate": "string" }],
  "keyPoints": ["string", ...]
}

Transcripción o notas de la reunión:
"""
${truncated}
"""`;
}
