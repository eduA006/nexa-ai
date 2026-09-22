export type GenerateCorrectedResponse = { url: string } | { error: string };

/**
 * Ruta API en vez de Server Action — ver comentario en
 * app/api/tools/apa/generate-corrected/route.ts sobre por qué.
 */
export async function generateCorrectedDocument(
  documentId: string,
): Promise<GenerateCorrectedResponse> {
  const response = await fetch("/api/tools/apa/generate-corrected", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId }),
  });
  const data: GenerateCorrectedResponse = await response.json();
  return data;
}
