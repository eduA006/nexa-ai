"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";
import { analyzeSummarizeDocument } from "@/lib/documents/analyze/summarize";

export type SummarizeResult = {
  documentId: string;
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  conclusions: string;
};

export type SummarizeActionState = { error: string } | { result: SummarizeResult } | undefined;


export async function runSummarize(
  _prevState: SummarizeActionState,
  formData: FormData,
): Promise<SummarizeActionState> {
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
    return { error: "Resumir documento solo admite documentos DOCX por ahora." };
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
    analysis = await analyzeSummarizeDocument(buffer);
  } catch (error) {
    console.error("[Summarize] Error al resumir documento:", error);
    return { error: "No se pudo completar el resumen. Inténtalo nuevamente." };
  }

  const result: SummarizeResult = {
    documentId,
    shortSummary: analysis.shortSummary,
    detailedSummary: analysis.detailedSummary,
    keyPoints: analysis.keyPoints,
    conclusions: analysis.conclusions,
  };

  await supabase.from("document_analyses").insert({
    document_id: documentId,
    user_id: user.id,
    analysis_type: "summary",
    result,
    score: null,
  });

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "resumir",
    input: doc.name,
    result: { shortSummary: analysis.shortSummary },
    provider: analysis.provider,
    model: analysis.model,
    tokens_used: analysis.tokensUsed,
  });

  return { result };
}
