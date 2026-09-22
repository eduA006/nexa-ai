"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";
import { analyzeSpreadsheet } from "@/lib/documents/analyze/excel";
import type { ColumnStat } from "@/lib/documents/extract/spreadsheet";

export type ExcelResult = {
  documentId: string;
  headers: string[];
  rowCount: number;
  columnStats: ColumnStat[];
  aiSummary: string;
  trends: string[];
  notableFindings: string[];
};

export type ExcelActionState = { error: string } | { result: ExcelResult } | undefined;


export async function runExcelAnalysis(
  _prevState: ExcelActionState,
  formData: FormData,
): Promise<ExcelActionState> {
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

  if (doc.file_type !== "xlsx" && doc.file_type !== "csv") {
    return { error: "El Analizador de Excel/CSV solo admite documentos XLSX o CSV." };
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
    analysis = await analyzeSpreadsheet(buffer, doc.file_type);
  } catch (error) {
    console.error("[Excel] Error al analizar hoja de cálculo:", error);
    return { error: "No se pudo completar el análisis. Verifica que el archivo tenga un formato de tabla válido." };
  }

  const result: ExcelResult = {
    documentId,
    headers: analysis.headers,
    rowCount: analysis.rowCount,
    columnStats: analysis.columnStats,
    aiSummary: analysis.aiSummary,
    trends: analysis.trends,
    notableFindings: analysis.notableFindings,
  };

  await supabase.from("document_analyses").insert({
    document_id: documentId,
    user_id: user.id,
    analysis_type: "excel",
    result,
    score: null,
  });

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "excel-csv",
    input: doc.name,
    result: { summary: analysis.aiSummary },
    provider: analysis.provider,
    model: analysis.model,
    tokens_used: analysis.tokensUsed,
  });

  return { result };
}
