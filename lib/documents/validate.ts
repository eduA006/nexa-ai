export type AllowedFileType = "pdf" | "docx" | "xlsx" | "csv";

const ALLOWED_EXTENSIONS: Record<string, AllowedFileType> = {
  pdf: "pdf",
  docx: "docx",
  xlsx: "xlsx",
  csv: "csv",
};

/**
 * Firmas de bytes (magic numbers) de cada formato soportado. No confiamos
 * únicamente en la extensión ni en el MIME type declarado por el cliente.
 */
async function detectFileType(file: File): Promise<AllowedFileType | null> {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46; // %PDF
  if (isPdf) return "pdf";

  // DOCX y XLSX son archivos ZIP (firma "PK").
  const isZip = head[0] === 0x50 && head[1] === 0x4b;
  if (isZip) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "docx") return "docx";
    if (ext === "xlsx") return "xlsx";
    return null;
  }

  // CSV no tiene firma binaria; se acepta por extensión + contenido de texto plano.
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    const sample = await file.slice(0, 512).text();
    // eslint-disable-next-line no-control-regex
    const looksBinary = /[\x00-\x08\x0e-\x1f]/.test(sample);
    return looksBinary ? null : "csv";
  }

  return null;
}

export type FileValidationResult =
  | { ok: true; type: AllowedFileType }
  | { ok: false; error: string };

export async function validateFile(
  file: File,
  maxSizeMb: number,
): Promise<FileValidationResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !(ext in ALLOWED_EXTENSIONS)) {
    return {
      ok: false,
      error: "Formato no soportado. Usa PDF, DOCX, XLSX o CSV.",
    };
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return { ok: false, error: `El archivo supera el límite de ${maxSizeMb} MB.` };
  }

  const detected = await detectFileType(file);
  if (!detected) {
    return {
      ok: false,
      error: "El contenido del archivo no coincide con un PDF, DOCX, XLSX o CSV válido.",
    };
  }

  return { ok: true, type: detected };
}
