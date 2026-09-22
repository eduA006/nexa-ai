"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/config/limits";
import { analyzeApaDocument } from "@/lib/documents/analyze/apa";
import { applyDocxFormatFixes } from "@/lib/documents/generate/docx-corrections";
import type { RuleFinding } from "@/lib/rules/apa";

const DOCUMENTS_BUCKET = "documents";

export type ApaResult = {
  documentId: string;
  formatFindings: RuleFinding[];
  writingFindings: RuleFinding[];
  aiSummary: string;
  formatScore: number;
  writingScore: number;
};

export type ApaActionState = { error: string } | { result: ApaResult } | undefined;

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export async function runApaAnalysis(
  _prevState: ApaActionState,
  formData: FormData,
): Promise<ApaActionState> {
  const documentId = formData.get("documentId");
  if (typeof documentId !== "string" || !documentId) {
    return { error: "Selecciona un documento." };
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

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("storage_path, file_type, name")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (docError || !doc) {
    return { error: "Documento no encontrado." };
  }

  if (doc.file_type !== "docx") {
    return { error: "El Corrector APA solo admite documentos DOCX por ahora." };
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);

  if (downloadError || !fileBlob) {
    return { error: "No se pudo descargar el documento." };
  }

  let analysis;
  try {
    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    analysis = await analyzeApaDocument(buffer);
  } catch (error) {
    console.error("[APA] Error al analizar documento:", error);
    return { error: "No se pudo completar el análisis. Inténtalo nuevamente." };
  }

  const result: ApaResult = {
    documentId,
    formatFindings: analysis.formatFindings,
    writingFindings: analysis.writingFindings,
    aiSummary: analysis.aiSummary,
    formatScore: analysis.formatScore,
    writingScore: analysis.writingScore,
  };

  await supabase.from("document_analyses").insert({
    document_id: documentId,
    user_id: user.id,
    analysis_type: "apa",
    result,
    score: analysis.formatScore,
  });

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "apa",
    input: doc.name,
    result: { summary: analysis.aiSummary },
    provider: analysis.provider,
    model: analysis.model,
    tokens_used: analysis.tokensUsed,
  });

  return { result };
}

export type GenerateCorrectedDocState = { url: string } | { error: string };

/**
 * Aplica las correcciones de formato deterministas (márgenes,
 * interlineado, sangría, fuente/tamaño) y sube el DOCX corregido a
 * Storage. No corrige numeración de página, referencias, ni contenido
 * de redacción — eso requiere revisión humana.
 */
export async function generateCorrectedDocument(
  documentId: string,
): Promise<GenerateCorrectedDocState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Vuelve a iniciar sesión." };

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("storage_path, file_type, original_filename")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (docError || !doc) return { error: "Documento no encontrado." };
  if (doc.file_type !== "docx") {
    return { error: "Solo se pueden generar correcciones para documentos DOCX." };
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(doc.storage_path);

  if (downloadError || !fileBlob) return { error: "No se pudo descargar el documento original." };

  let correctedBuffer: Buffer;
  try {
    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    correctedBuffer = await applyDocxFormatFixes(buffer);
  } catch (error) {
    console.error("[APA] Error al generar DOCX corregido:", error);
    return { error: "No se pudo generar el documento corregido." };
  }

  const correctedPath = `${user.id}/corregidos/${crypto.randomUUID()}-corregido-${doc.original_filename}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(correctedPath, correctedBuffer, {
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

  if (uploadError) return { error: "No se pudo guardar el documento corregido." };

  await supabase
    .from("documents")
    .update({ processed_storage_path: correctedPath, status: "processed" })
    .eq("id", documentId)
    .eq("user_id", user.id);

  revalidatePath("/documents");

  const { data: signed, error: signError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(correctedPath, 60);

  if (signError || !signed) return { error: "No se pudo generar el enlace de descarga." };

  return { url: signed.signedUrl };
}
