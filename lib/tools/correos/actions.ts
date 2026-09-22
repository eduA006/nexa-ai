"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";
import { generateStructured } from "@/lib/ai/service";
import { correoResultSchema, buildCorreoPrompt, type CorreoAction, type CorreoResult } from "@/lib/ai/prompts/correos";

const VALID_ACTIONS: CorreoAction[] = ["redactar", "mejorar", "resumir", "tono"];

function isCorreoAction(value: FormDataEntryValue | null): value is CorreoAction {
  return typeof value === "string" && VALID_ACTIONS.includes(value as CorreoAction);
}

export type CorreoActionState = { error: string } | { result: CorreoResult } | undefined;


/**
 * Sin documento subido, igual que el Ayudante de programación — el
 * texto se pega directo en el formulario. Solo se registra en
 * `ai_sessions` (no aplica `document_analyses`, que exige un
 * `document_id` real).
 */
export async function runCorreoAssist(
  _prevState: CorreoActionState,
  formData: FormData,
): Promise<CorreoActionState> {
  const text = formData.get("text");
  const action = formData.get("action");
  const tone = formData.get("tone");

  if (typeof text !== "string" || text.trim().length === 0) {
    return { error: "Escribe el contenido o las instrucciones del correo." };
  }
  if (!isCorreoAction(action)) {
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

  const toneStr = typeof tone === "string" ? tone : "";

  let data: CorreoResult;
  let provider: string;
  let model: string;
  let tokensUsed: number | null;
  try {
    const generated = await generateStructured(
      buildCorreoPrompt(text, action, toneStr),
      correoResultSchema,
      { system: "Eres un asistente experto en redacción de correos profesionales en español." },
    );
    data = generated.data;
    provider = generated.result.provider;
    model = generated.result.model;
    tokensUsed = generated.result.tokensUsed;
  } catch (error) {
    console.error("[Correos] Error al procesar correo:", error);
    return { error: "No se pudo completar la solicitud. Inténtalo nuevamente." };
  }

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "correos",
    input: `[${action}] ${text.slice(0, 200)}`,
    result: { subject: data.subject },
    provider,
    model,
    tokens_used: tokensUsed,
  });

  return { result: data };
}
