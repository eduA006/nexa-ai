"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/config/limits";
import { generateStructured } from "@/lib/ai/service";
import { generatedCvSchema, buildGeneradorCvPrompt, type GeneratedCv } from "@/lib/ai/prompts/generador-cv";

export type GeneradorCvActionState = { error: string } | { result: GeneratedCv } | undefined;

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Sin documento subido — el usuario ingresa sus datos directamente.
 * Solo se registra en `ai_sessions`, igual que Correos/Programación.
 */
export async function runGeneradorCv(
  _prevState: GeneradorCvActionState,
  formData: FormData,
): Promise<GeneradorCvActionState> {
  const fullName = str(formData, "fullName");
  const email = str(formData, "email");

  if (!fullName.trim()) return { error: "Ingresa tu nombre completo." };
  if (!email.trim()) return { error: "Ingresa tu correo." };

  const experienceNotes = str(formData, "experienceNotes");
  const educationNotes = str(formData, "educationNotes");
  if (!experienceNotes.trim() && !educationNotes.trim()) {
    return { error: "Ingresa al menos tu experiencia o tu educación." };
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

  let data: GeneratedCv;
  let provider: string;
  let model: string;
  let tokensUsed: number | null;
  try {
    const generated = await generateStructured(
      buildGeneradorCvPrompt({
        fullName,
        email,
        phone: str(formData, "phone"),
        location: str(formData, "location"),
        targetRole: str(formData, "targetRole"),
        profileNotes: str(formData, "profileNotes"),
        experienceNotes,
        educationNotes,
        skillsNotes: str(formData, "skillsNotes"),
      }),
      generatedCvSchema,
      { system: "Eres un asistente experto en redactar CVs profesionales en español." },
    );
    data = generated.data;
    provider = generated.result.provider;
    model = generated.result.model;
    tokensUsed = generated.result.tokensUsed;
  } catch (error) {
    console.error("[GeneradorCv] Error al generar CV:", error);
    return { error: "No se pudo generar el CV. Inténtalo nuevamente." };
  }

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "generador-cv",
    input: fullName,
    result: { experienceCount: data.experience.length },
    provider,
    model,
    tokens_used: tokensUsed,
  });

  return { result: data };
}
