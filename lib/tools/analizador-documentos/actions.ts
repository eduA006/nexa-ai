"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/config/limits";
import { analyzeDocumentFacts } from "@/lib/documents/analyze/analizador-documentos";

export type AnalizadorDocumentosResult = {
  documentId: string;
  dates: string[];
  amounts: string[];
  people: { name: string; role: string }[];
  obligations: { party: string; description: string }[];
};

export type AnalizadorDocumentosActionState =
  | { error: string }
  | { result: AnalizadorDocumentosResult }
  | undefined;

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export async function runAnalizadorDocumentos(
  _prevState: AnalizadorDocumentosActionState,
  formData: FormData,
): Promise<AnalizadorDocumentosActionState> {
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
    return { error: "El Analizador de documentos solo admite documentos DOCX por ahora." };
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
    analysis = await analyzeDocumentFacts(buffer);
  } catch (error) {
    console.error("[AnalizadorDocumentos] Error al analizar documento:", error);
    return { error: "No se pudo completar el análisis. Inténtalo nuevamente." };
  }

  const result: AnalizadorDocumentosResult = {
    documentId,
    dates: analysis.dates,
    amounts: analysis.amounts,
    people: analysis.people,
    obligations: analysis.obligations,
  };

  await supabase.from("document_analyses").insert({
    document_id: documentId,
    user_id: user.id,
    analysis_type: "extraccion-datos",
    result,
    score: null,
  });

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "analizador-documentos",
    input: doc.name,
    result: { peopleCount: analysis.people.length, obligationCount: analysis.obligations.length },
    provider: analysis.provider,
    model: analysis.model,
    tokens_used: analysis.tokensUsed,
  });

  return { result };
}
