import "server-only";
import { GeminiProvider } from "@/lib/ai/gemini";
import { GroqProvider } from "@/lib/ai/groq";
import {
  AIProviderError,
  type AIProvider,
  type GenerateOptions,
  type GenerateResult,
} from "@/lib/ai/provider";

function buildProviders(): AIProvider[] {
  const primary = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  const gemini = process.env.GEMINI_API_KEY
    ? new GeminiProvider(process.env.GEMINI_API_KEY)
    : null;
  const groq = process.env.GROQ_API_KEY
    ? new GroqProvider(process.env.GROQ_API_KEY)
    : null;

  const ordered: (AIProvider | null)[] = primary === "groq" ? [groq, gemini] : [gemini, groq];
  return ordered.filter((provider): provider is AIProvider => provider !== null);
}

/**
 * Único punto de entrada de la aplicación hacia proveedores de IA.
 * Intenta el proveedor principal (`AI_PROVIDER`, default "gemini") y usa
 * el otro configurado como fallback si falla. Los módulos de negocio
 * nunca deben importar GeminiProvider/GroqProvider directamente.
 */
export async function generateText(
  prompt: string,
  options?: GenerateOptions,
): Promise<GenerateResult> {
  const providers = buildProviders();

  if (providers.length === 0) {
    throw new AIProviderError("ai-service", "No hay proveedores de IA configurados.");
  }

  let lastError: unknown;
  for (const provider of providers) {
    try {
      return await provider.generate(prompt, options);
    } catch (error) {
      lastError = error;
      console.error(`[AIService] Falló el proveedor "${provider.name}":`, error);
    }
  }

  throw new AIProviderError(
    "ai-service",
    "Todos los proveedores de IA fallaron. Inténtalo más tarde.",
    lastError,
  );
}

type ParsableSchema<T> = { parse: (data: unknown) => T };

/**
 * Como `generateText`, pero exige salida JSON y la valida con `schema`
 * (pensado para un esquema Zod). Lanza si el modelo no devuelve JSON
 * válido o si no cumple el esquema — nunca confiar ciegamente en texto
 * generado por IA.
 */
export async function generateStructured<T>(
  prompt: string,
  schema: ParsableSchema<T>,
  options?: GenerateOptions,
): Promise<{ data: T; result: GenerateResult }> {
  const result = await generateText(prompt, { ...options, json: true });

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch (cause) {
    throw new AIProviderError("ai-service", "La IA no devolvió JSON válido.", cause);
  }

  return { data: schema.parse(parsed), result };
}
