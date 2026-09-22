import "server-only";
import {
  AIProviderError,
  fetchWithRetry,
  type AIProvider,
  type GenerateOptions,
  type GenerateResult,
} from "@/lib/ai/provider";

const DEFAULT_MODEL = "gemini-3.8-flash";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private readonly model: string;

  constructor(
    private readonly apiKey: string,
    model?: string,
  ) {
    this.model = model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  }

  async generate(
    prompt: string,
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (options.system) {
      body.systemInstruction = { parts: [{ text: options.system }] };
    }

    const generationConfig: Record<string, unknown> = {};
    if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
    if (options.maxOutputTokens !== undefined) generationConfig.maxOutputTokens = options.maxOutputTokens;
    if (options.json) generationConfig.responseMimeType = "application/json";
    if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;

    let response: Response;
    try {
      response = await fetchWithRetry(() =>
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": this.apiKey,
            },
            body: JSON.stringify(body),
          },
        ),
      );
    } catch (cause) {
      throw new AIProviderError(this.name, "No se pudo conectar con Gemini.", cause);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AIProviderError(
        this.name,
        `Gemini respondió con estado ${response.status}.`,
        detail,
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      throw new AIProviderError(this.name, "Respuesta de Gemini sin contenido de texto.");
    }

    return {
      text,
      provider: this.name,
      model: data?.modelVersion ?? this.model,
      tokensUsed: data?.usageMetadata?.totalTokenCount ?? null,
    };
  }
}
