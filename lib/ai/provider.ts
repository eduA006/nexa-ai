export type GenerateOptions = {
  /** Instrucción de sistema (rol, tono, restricciones). */
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** Pide al modelo que responda únicamente con JSON válido. */
  json?: boolean;
};

export type GenerateResult = {
  text: string;
  provider: string;
  model: string;
  tokensUsed: number | null;
};

export interface AIProvider {
  readonly name: string;
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
}

export class AIProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

const RETRYABLE_STATUS_CODES = [429, 503];

/**
 * Reintenta una petición fetch cuando la respuesta trae un código
 * transitorio conocido (429 rate limit, 503 servicio no disponible —
 * ambos comunes y documentados como "reintenta más tarde" por Gemini y
 * proveedores compatibles con OpenAI). No reintenta otros errores 4xx/5xx.
 */
export async function fetchWithRetry(
  makeRequest: () => Promise<Response>,
  { retries = 2, baseDelayMs = 500 }: { retries?: number; baseDelayMs?: number } = {},
): Promise<Response> {
  let response: Response;
  for (let attempt = 0; ; attempt++) {
    response = await makeRequest();
    const shouldRetry = RETRYABLE_STATUS_CODES.includes(response.status) && attempt < retries;
    if (!shouldRetry) return response;
    await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (attempt + 1)));
  }
}
