"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/config/limits";
import { analyzeCvDocument } from "@/lib/documents/analyze/cv";
import type { RuleFinding } from "@/lib/rules/types";

export type CvResult = {
  documentId: string;
  structureFindings: RuleFinding[];
  contentFindings: RuleFinding[];
  aiSummary: string;
  structureScore: number;
  contentScore: number;
};

export type CvActionState = { error: string } | { result: CvResult } | undefined;

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export async function runCvAnalysis(
  _prevState: CvActionState,
  formData: FormData,
): Promise<CvActionState> {
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
    return { error: "El Analizador de CV solo admite documentos DOCX por ahora." };
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
    analysis = await analyzeCvDocument(buffer);
  } catch (error) {
    console.error("[CV] Error al analizar documento:", error);
    return { error: "No se pudo completar el análisis. Inténtalo nuevamente." };
  }

  const result: CvResult = {
    documentId,
    structureFindings: analysis.structureFindings,
    contentFindings: analysis.contentFindings,
    aiSummary: analysis.aiSummary,
    structureScore: analysis.structureScore,
    contentScore: analysis.contentScore,
  };

  await supabase.from("document_analyses").insert({
    document_id: documentId,
    user_id: user.id,
    analysis_type: "cv",
    result,
    score: analysis.contentScore,
  });

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "analizador-cv",
    input: doc.name,
    result: { summary: analysis.aiSummary },
    provider: analysis.provider,
    model: analysis.model,
    tokens_used: analysis.tokensUsed,
  });

  return { result };
}
