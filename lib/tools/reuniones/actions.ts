"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/config/limits";
import { generateStructured } from "@/lib/ai/service";
import { reunionResultSchema, buildReunionPrompt, type ReunionResult } from "@/lib/ai/prompts/reuniones";

export type ReunionActionState = { error: string } | { result: ReunionResult } | undefined;

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

/**
 * Sin documento subido, igual que Correos/Programación/Generador de CV —
 * el texto se pega directo. Solo se registra en `ai_sessions`.
 */
export async function runReunionSummary(
  _prevState: ReunionActionState,
  formData: FormData,
): Promise<ReunionActionState> {
  const text = formData.get("text");
  if (typeof text !== "string" || text.trim().length === 0) {
    return { error: "Pega la transcripción o notas de la reunión." };
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

  let data: ReunionResult;
  let provider: string;
  let model: string;
  let tokensUsed: number | null;
  try {
    const generated = await generateStructured(
      buildReunionPrompt(text),
      reunionResultSchema,
      { system: "Eres un asistente experto en extraer información estructurada de reuniones." },
    );
    data = generated.data;
    provider = generated.result.provider;
    model = generated.result.model;
    tokensUsed = generated.result.tokensUsed;
  } catch (error) {
    console.error("[Reuniones] Error al resumir reunión:", error);
    return { error: "No se pudo completar el resumen. Inténtalo nuevamente." };
  }

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "reuniones",
    input: text.slice(0, 200),
    result: { summary: data.summary },
    provider,
    model,
    tokens_used: tokensUsed,
  });

  return { result: data };
}
