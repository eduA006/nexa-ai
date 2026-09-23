const MAX_SIZE_MB = 8;

/** Firmas de bytes — no confiamos únicamente en el MIME type declarado por el cliente. */
async function detectImageType(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (isJpeg) return "jpeg";

  const isPng =
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  if (isPng) return "png";

  const isWebp =
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  if (isWebp) return "webp";

  return null;
}

export type ImageValidationResult = { ok: true; type: string } | { ok: false; error: string };

/** Valida una captura de comprobante de pago: solo imágenes JPEG/PNG/WEBP. */
export async function validatePaymentProof(file: File): Promise<ImageValidationResult> {
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { ok: false, error: `La imagen supera el límite de ${MAX_SIZE_MB} MB.` };
  }

  const detected = await detectImageType(file);
  if (!detected) {
    return { ok: false, error: "Sube una captura en formato JPEG, PNG o WEBP." };
  }

  return { ok: true, type: detected };
}
