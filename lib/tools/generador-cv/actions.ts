"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";
import { canAccessTool } from "@/lib/config/plans";
import { generateStructured } from "@/lib/ai/service";
import { generatedCvSchema, buildGeneradorCvPrompt, type GeneratedCv } from "@/lib/ai/prompts/generador-cv";
import { buildCvDocx } from "@/lib/documents/generate/cv-docx";

const DOCUMENTS_BUCKET = "documents";

export type GeneradorCvActionResult = GeneratedCv & { storagePath: string };
export type GeneradorCvActionState = { error: string } | { result: GeneradorCvActionResult } | undefined;


function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Sin documento subido — el usuario ingresa sus datos directamente.
 * Igual que Generador de documentos/informes, produce un DOCX real
 * descargable y lo registra en `documents`, por lo que valida ambos
 * límites diarios (IA y documentos creados).
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

  const { data: profile } = await supabase.from("profiles").select("plan, pro_expires_at").eq("user_id", user.id).single();
  if (!canAccessTool("generador-cv", profile)) {
    return { error: "Esta herramienta requiere el plan Pro." };
  }

  const [{ count: aiCount }, { count: docCount }] = await Promise.all([
    supabase
      .from("ai_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfTodayIso()),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfTodayIso()),
  ]);

  if ((aiCount ?? 0) >= LIMITS.MAX_AI_REQUESTS_PER_DAY) {
    return { error: "Has alcanzado el límite diario gratuito de solicitudes de IA." };
  }
  if ((docCount ?? 0) >= LIMITS.MAX_DOCUMENTS_PER_DAY) {
    return { error: "Has alcanzado el límite diario gratuito de documentos." };
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

  let buffer: Buffer;
  try {
    buffer = await buildCvDocx(data);
  } catch (error) {
    console.error("[GeneradorCv] Error al construir el DOCX:", error);
    return { error: "El CV se generó pero no se pudo empaquetar como DOCX." };
  }

  const safeName = data.fullName.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "cv";
  const storagePath = `${user.id}/generados/${crypto.randomUUID()}-${safeName}.docx`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

  if (uploadError) {
    return { error: "No se pudo guardar el CV generado." };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    user_id: user.id,
    name: `CV — ${data.fullName}`,
    original_filename: `${safeName}.docx`,
    file_type: "docx",
    storage_path: storagePath,
    status: "uploaded",
  });

  if (insertError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return { error: "No se pudo registrar el CV generado." };
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

  revalidatePath("/documents");

  return { result: { ...data, storagePath } };
}
