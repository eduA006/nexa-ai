"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/config/limits";
import { analyzeSpreadsheet } from "@/lib/documents/analyze/excel";
import { buildInformeDocx } from "@/lib/documents/generate/informe-docx";

const DOCUMENTS_BUCKET = "documents";

export type InformeActionResult = {
  title: string;
  rowCount: number;
  aiSummary: string;
  trends: string[];
  notableFindings: string[];
  downloadUrl: string;
};

export type InformeActionState = { error: string } | { result: InformeActionResult } | undefined;

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

/**
 * Reutiliza el mismo análisis determinista + IA del Analizador de
 * Excel/CSV (`analyzeSpreadsheet`) y lo empaqueta como un DOCX real
 * descargable con tabla de estadísticas, a diferencia de esa
 * herramienta que solo muestra los resultados en pantalla.
 */
export async function runGenerarInforme(
  _prevState: InformeActionState,
  formData: FormData,
): Promise<InformeActionState> {
  const documentId = formData.get("documentId");
  const titleInput = formData.get("title");

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
    return { error: "El Generador de informes solo admite documentos XLSX o CSV como fuente de datos." };
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);

  if (downloadError || !fileBlob) {
    return { error: "No se pudo descargar el documento fuente." };
  }

  const title = typeof titleInput === "string" && titleInput.trim() ? titleInput.trim() : `Informe — ${doc.name}`;

  let analysis;
  let buffer: Buffer;
  try {
    const sourceBuffer = Buffer.from(await fileBlob.arrayBuffer());
    analysis = await analyzeSpreadsheet(sourceBuffer, doc.file_type);
    buffer = await buildInformeDocx({
      title,
      rowCount: analysis.rowCount,
      columnStats: analysis.columnStats,
      aiSummary: analysis.aiSummary,
      trends: analysis.trends,
      notableFindings: analysis.notableFindings,
    });
  } catch (error) {
    console.error("[Informes] Error al generar informe:", error);
    return { error: "No se pudo generar el informe. Inténtalo nuevamente." };
  }

  const safeName = title.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "informe";
  const storagePath = `${user.id}/generados/${crypto.randomUUID()}-${safeName}.docx`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

  if (uploadError) {
    return { error: "No se pudo guardar el informe generado." };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    user_id: user.id,
    name: title,
    original_filename: `${safeName}.docx`,
    file_type: "docx",
    storage_path: storagePath,
    status: "uploaded",
  });

  if (insertError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return { error: "No se pudo registrar el informe generado." };
  }

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "informes",
    input: doc.name,
    result: { title },
    provider: analysis.provider,
    model: analysis.model,
    tokens_used: analysis.tokensUsed,
  });

  const { data: signed, error: signError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (signError || !signed) {
    return { error: "El informe se guardó, pero no se pudo generar el enlace de descarga. Revísalo en Mis documentos." };
  }

  revalidatePath("/documents");

  return {
    result: {
      title,
      rowCount: analysis.rowCount,
      aiSummary: analysis.aiSummary,
      trends: analysis.trends,
      notableFindings: analysis.notableFindings,
      downloadUrl: signed.signedUrl,
    },
  };
}
