/**
 * Helper de cliente para pedir una URL de descarga firmada vía la ruta
 * API (no Server Action — ver comentario en
 * app/api/documents/download-url/route.ts sobre por qué).
 */
export async function fetchDownloadUrl(storagePath: string): Promise<string | null> {
  const response = await fetch(`/api/documents/download-url?path=${encodeURIComponent(storagePath)}`);
  if (!response.ok) return null;
  const data: { url?: string } = await response.json();
  return data.url ?? null;
}
