import "server-only";
import {
  AIProviderError,
  type AIProvider,
  type GenerateOptions,
  type GenerateResult,
} from "@/lib/ai/provider";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export class GroqProvider implements AIProvider {
  readonly name = "groq";
  private readonly model: string;

  constructor(
    private readonly apiKey: string,
    model?: string,
  ) {
    this.model = model || process.env.GROQ_MODEL || DEFAULT_MODEL;
  }

  async generate(
    prompt: string,
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    const messages: { role: string; content: string }[] = [];
    if (options.system) messages.push({ role: "system", content: options.system });
    messages.push({ role: "user", content: prompt });

    const body: Record<string, unknown> = { model: this.model, messages };
    if (options.temperature !== undefined) body.temperature = options.temperature;
    if (options.maxOutputTokens !== undefined) body.max_tokens = options.maxOutputTokens;
    if (options.json) body.response_format = { type: "json_object" };

    let response: Response;
    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (cause) {
      throw new AIProviderError(this.name, "No se pudo conectar con Groq.", cause);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AIProviderError(
        this.name,
        `Groq respondió con estado ${response.status}.`,
        detail,
      );
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      throw new AIProviderError(this.name, "Respuesta de Groq sin contenido de texto.");
    }

    return {
      text,
      provider: this.name,
      model: data?.model ?? this.model,
      tokensUsed: data?.usage?.total_tokens ?? null,
    };
  }
}
