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

/**
 * Dispara una descarga de archivo sin usar window.open(): un enlace
 * temporal con click() programático no depende de la política de
 * ventanas emergentes del navegador (que en la práctica resultó
 * bloqueando window.open incluso llamado de forma síncrona dentro del
 * gesto de clic, en al menos un navegador real probado por el usuario).
 */
export function triggerFileDownload(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
