"use server";

import { createClient } from "@/lib/supabase/server";
import { analyzeBibliografiaDocument } from "@/lib/documents/analyze/bibliografia";
import type { RuleFinding } from "@/lib/rules/types";

export type BibliografiaResult = {
  documentId: string;
  findings: RuleFinding[];
  score: number;
  citationCount: number;
  referenceCount: number;
};

export type BibliografiaActionState = { error: string } | { result: BibliografiaResult } | undefined;

export async function runBibliografiaAnalysis(
  _prevState: BibliografiaActionState,
  formData: FormData,
): Promise<BibliografiaActionState> {
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
    return { error: "El Analizador de bibliografía solo admite documentos DOCX por ahora." };
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
    analysis = await analyzeBibliografiaDocument(buffer);
  } catch (error) {
    console.error("[Bibliografia] Error al analizar documento:", error);
    return { error: "No se pudo completar el análisis. Inténtalo nuevamente." };
  }

  const result: BibliografiaResult = {
    documentId,
    findings: analysis.findings,
    score: analysis.score,
    citationCount: analysis.citationCount,
    referenceCount: analysis.referenceCount,
  };

  // Sin llamada a IA: no aplica el límite diario de IA ni se registra en ai_sessions.
  await supabase.from("document_analyses").insert({
    document_id: documentId,
    user_id: user.id,
    analysis_type: "bibliografia",
    result,
    score: analysis.score,
  });

  return { result };
}
