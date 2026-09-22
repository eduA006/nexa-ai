"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";
import { analyzeApaDocument } from "@/lib/documents/analyze/apa";
import type { RuleFinding } from "@/lib/rules/apa";

export type ApaResult = {
  documentId: string;
  formatFindings: RuleFinding[];
  writingFindings: RuleFinding[];
  aiSummary: string;
  formatScore: number;
  writingScore: number;
};

export type ApaActionState = { error: string } | { result: ApaResult } | undefined;


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
