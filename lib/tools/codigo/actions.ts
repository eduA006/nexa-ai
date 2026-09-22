"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/config/limits";
import { generateStructured } from "@/lib/ai/service";
import { codigoResultSchema, buildCodigoPrompt, type CodigoAction, type CodigoResult } from "@/lib/ai/prompts/codigo";

const VALID_ACTIONS: CodigoAction[] = ["explicar", "corregir", "mejorar", "documentar"];

function isCodigoAction(value: FormDataEntryValue | null): value is CodigoAction {
  return typeof value === "string" && VALID_ACTIONS.includes(value as CodigoAction);
}

export type CodigoActionState = { error: string } | { result: CodigoResult } | undefined;

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

/**
 * A diferencia del resto de herramientas de la Fase 10, esta no procesa
 * un documento subido — el código se pega directo en el formulario. No
 * se inserta en `document_analyses` (esa tabla exige un `document_id`
 * real); solo se registra en `ai_sessions` para el límite diario y el
 * historial.
 */
export async function runCodigoAssist(
  _prevState: CodigoActionState,
  formData: FormData,
): Promise<CodigoActionState> {
  const code = formData.get("code");
  const language = formData.get("language");
  const action = formData.get("action");

  if (typeof code !== "string" || code.trim().length === 0) {
    return { error: "Pega el código que quieres analizar." };
  }
  if (!isCodigoAction(action)) {
    return { error: "Selecciona una acción válida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesión expirada. Vuelve a iniciar sesión." };
  }

  const { count } = await supabase
    .from("ai_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfTodayIso());

  if ((count ?? 0) >= LIMITS.MAX_AI_REQUESTS_PER_DAY) {
    return { error: "Has alcanzado el límite diario gratuito de solicitudes de IA." };
  }

  const languageStr = typeof language === "string" ? language : "";

  let data: CodigoResult;
  let provider: string;
  let model: string;
  let tokensUsed: number | null;
  try {
    const generated = await generateStructured(
      buildCodigoPrompt(code, languageStr, action),
      codigoResultSchema,
      { system: "Eres un asistente de programación experto en múltiples lenguajes." },
    );
    data = generated.data;
    provider = generated.result.provider;
    model = generated.result.model;
    tokensUsed = generated.result.tokensUsed;
  } catch (error) {
    console.error("[Codigo] Error al procesar código:", error);
    return { error: "No se pudo completar la solicitud. Inténtalo nuevamente." };
  }

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "programacion",
    input: `[${action}] ${code.slice(0, 200)}`,
    result: { summary: data.summary },
    provider,
    model,
    tokens_used: tokensUsed,
  });

  return { result: data };
}
