import { z } from "zod";

export const codigoFindingSchema = z.object({
  type: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  location: z.string(),
  description: z.string(),
  recommendation: z.string(),
});

export const codigoResultSchema = z.object({
  summary: z.string(),
  explanation: z.string(),
  findings: z.array(codigoFindingSchema).max(10),
  resultCode: z.string(),
});

export type CodigoResult = z.infer<typeof codigoResultSchema>;

export type CodigoAction = "explicar" | "corregir" | "mejorar" | "documentar";

const MAX_CHARS = 12000;

const ACTION_INSTRUCTIONS: Record<CodigoAction, string> = {
  explicar:
    'Explica qué hace el código, sección por sección, en "explanation" (detallado, en prosa). Deja "findings" vacío y "resultCode" igual al código original (sin cambios).',
  corregir:
    'Encuentra errores reales (bugs, excepciones no manejadas, lógica incorrecta) y repórtalos en "findings" (uno por error, con severidad). Pon el código corregido completo en "resultCode". "explanation" debe resumir qué se corrigió y por qué.',
  mejorar:
    'Sugiere mejoras de legibilidad, rendimiento o buenas prácticas en "findings" (uno por sugerencia, severidad "info" o "warning" salvo que sea un problema real). Pon el código mejorado completo en "resultCode". "explanation" debe resumir los cambios principales.',
  documentar:
    'Agrega comentarios y documentación (docstrings/JSDoc según el lenguaje) al código sin cambiar su lógica. Pon el resultado completo en "resultCode". Deja "findings" vacío. "explanation" debe ser breve, resumiendo qué se documentó.',
};

export function buildCodigoPrompt(code: string, language: string, action: CodigoAction): string {
  const truncated = code.length > MAX_CHARS ? `${code.slice(0, MAX_CHARS)}\n[...truncado por longitud...]` : code;
  const languageHint = language.trim() ? `Lenguaje: ${language.trim()}.` : "Detecta el lenguaje a partir de la sintaxis.";

  return `Eres un asistente de programación experto, que responde en español (los comentarios de código y explicaciones van en español; no traduzcas nombres de variables/funciones ni palabras clave del lenguaje).

${languageHint}

Tarea solicitada: "${action}". ${ACTION_INSTRUCTIONS[action]}

No inventes comportamiento que el código no tiene. Si el código está vacío o no es código real, dilo en "summary" y deja el resto de los campos vacíos.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "summary": "resumen breve de 1 a 2 oraciones",
  "explanation": "string",
  "findings": [{ "type": "string", "severity": "error"|"warning"|"info", "location": "string (ej. 'línea 12' o función)", "description": "string", "recommendation": "string" }],
  "resultCode": "string (código completo, sin backticks ni markdown)"
}

Código:
"""
${truncated}
"""`;
}
