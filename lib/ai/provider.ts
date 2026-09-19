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
