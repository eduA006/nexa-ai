/**
 * Límites de uso gratuito. Única fuente de verdad — ningún otro módulo
 * debe hardcodear estos valores.
 */

function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const LIMITS = {
  /** Máximo de solicitudes a proveedores de IA por usuario, por día. */
  MAX_AI_REQUESTS_PER_DAY: readIntEnv("MAX_AI_REQUESTS_PER_DAY", 20),
  /** Máximo de documentos que un usuario puede subir por día. */
  MAX_DOCUMENTS_PER_DAY: readIntEnv("MAX_DOCUMENTS_PER_DAY", 10),
  /** Tamaño máximo permitido por archivo, en megabytes. */
  MAX_FILE_SIZE_MB: readIntEnv("MAX_FILE_SIZE_MB", 10),
} as const;

export type Limits = typeof LIMITS;

/** Inicio del día actual en UTC, como ISO string — límite de "por día" en toda la app. */
export function startOfTodayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}
