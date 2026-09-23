"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";
import { canAccessTool } from "@/lib/config/plans";
import { analyzeContractRisk } from "@/lib/documents/analyze/riesgos-contratos";
import type { ContractClauseFlag } from "@/lib/ai/prompts/riesgos-contratos";

export type RiesgosContratosResult = {
  documentId: string;
  summary: string;
  flags: ContractClauseFlag[];
  missingClauses: string[];
};

export type RiesgosContratosActionState =
  | { error: string }
  | { result: RiesgosContratosResult }
  | undefined;

export async function runAnalizadorRiesgosContratos(
  _prevState: RiesgosContratosActionState,
  formData: FormData,
): Promise<RiesgosContratosActionState> {
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

  const { data: profile } = await supabase.from("profiles").select("plan").eq("user_id", user.id).single();
  if (!canAccessTool("riesgos-contratos", profile?.plan)) {
    return { error: "Esta herramienta requiere el plan Pro." };
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
    return { error: "El Analizador de riesgos y contratos solo admite documentos DOCX por ahora." };
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
    analysis = await analyzeContractRisk(buffer);
  } catch (error) {
    console.error("[RiesgosContratos] Error al analizar contrato:", error);
    return { error: "No se pudo completar el análisis. Inténtalo nuevamente." };
  }

  const result: RiesgosContratosResult = {
    documentId,
    summary: analysis.summary,
    flags: analysis.flags,
    missingClauses: analysis.missingClauses,
  };

  await supabase.from("document_analyses").insert({
    document_id: documentId,
    user_id: user.id,
    analysis_type: "riesgos-contratos",
    result,
    score: null,
  });

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "riesgos-contratos",
    input: doc.name,
    result: { flagCount: analysis.flags.length, missingCount: analysis.missingClauses.length },
    provider: analysis.provider,
    model: analysis.model,
    tokens_used: analysis.tokensUsed,
  });

  return { result };
}
