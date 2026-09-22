import { z } from "zod";

export const slideSchema = z.object({
  title: z.string(),
  bullets: z.array(z.string()).max(6),
  speakerNotes: z.string(),
});

export const presentationResultSchema = z.object({
  slides: z.array(slideSchema).max(15),
});

export type PresentationResult = z.infer<typeof presentationResultSchema>;

const MAX_CHARS = 12000;

export function buildPresentationPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_CHARS
      ? `${documentText.slice(0, MAX_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  return `Eres un asistente que convierte un documento en la estructura de una presentación de diapositivas en español.

Genera entre 6 y 15 diapositivas siguiendo buenas prácticas:
- Primera diapositiva: título de la presentación (usa "bullets" vacío o con el subtítulo).
- Una diapositiva de agenda/introducción.
- Diapositivas de contenido, una por cada tema principal del documento.
- Última diapositiva: conclusión o cierre.

Para cada diapositiva:
- "title": título corto de la diapositiva.
- "bullets": hasta 6 puntos, cada uno una FRASE CORTA (no oraciones completas ni párrafos) — así se vería en una diapositiva real, no un resumen en prosa.
- "speakerNotes": 1 a 2 oraciones de lo que el presentador diría al mostrar esta diapositiva, con más detalle del que cabe en los bullets.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "slides": [{ "title": "string", "bullets": ["string", ...], "speakerNotes": "string" }]
}

Documento base:
"""
${truncated}
"""`;
}
