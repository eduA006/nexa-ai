"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";
import { analyzeExposicionDocument } from "@/lib/documents/analyze/exposiciones";
import type { ExposicionResult } from "@/lib/ai/prompts/exposiciones";

export type ExposicionActionResult = ExposicionResult & { documentId: string };

export type ExposicionActionState =
  | { error: string }
  | { result: ExposicionActionResult }
  | undefined;


export async function runExposicionAnalysis(
  _prevState: ExposicionActionState,
  formData: FormData,
): Promise<ExposicionActionState> {
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
    return { error: "El Preparador de exposiciones solo admite documentos DOCX por ahora." };
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
    analysis = await analyzeExposicionDocument(buffer);
  } catch (error) {
    console.error("[Exposiciones] Error al generar exposición:", error);
    return { error: "No se pudo completar la preparación. Inténtalo nuevamente." };
  }

  const result: ExposicionActionResult = {
    documentId,
    structure: analysis.structure,
    script: analysis.script,
    questions: analysis.questions,
  };

  await supabase.from("document_analyses").insert({
    document_id: documentId,
    user_id: user.id,
    analysis_type: "exposicion",
    result,
    score: null,
  });

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "exposiciones",
    input: doc.name,
    result: { sectionCount: analysis.structure.length },
    provider: analysis.provider,
    model: analysis.model,
    tokens_used: analysis.tokensUsed,
  });

  return { result };
}
