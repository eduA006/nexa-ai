"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/config/limits";
import { generateStructured } from "@/lib/ai/service";
import { documentoResultSchema, buildDocumentoPrompt, type DocumentoType, type DocumentoResult } from "@/lib/ai/prompts/documentos";
import { buildDocumentoDocx } from "@/lib/documents/generate/documento-docx";

const DOCUMENTS_BUCKET = "documents";
const VALID_TYPES: DocumentoType[] = ["informe", "memorando", "carta", "propuesta"];

function isDocumentoType(value: FormDataEntryValue | null): value is DocumentoType {
  return typeof value === "string" && VALID_TYPES.includes(value as DocumentoType);
}

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export type DocumentoActionResult = DocumentoResult & { downloadUrl: string };
export type DocumentoActionState = { error: string } | { result: DocumentoActionResult } | undefined;

/**
 * A diferencia de las demás herramientas sin documento (Correos,
 * Programación, Generador de CV, Reuniones), esta SÍ produce un DOCX
 * real descargable — usando la librería `docx` ya presente en el
 * proyecto, sin dependencias nuevas — y lo registra en `documents` para
 * que aparezca también en "Mis documentos". Por eso valida ambos
 * límites diarios: el de IA y el de documentos creados.
 */
export async function runGenerarDocumento(
  _prevState: DocumentoActionState,
  formData: FormData,
): Promise<DocumentoActionState> {
  const type = formData.get("type");
  const instructions = formData.get("instructions");

  if (!isDocumentoType(type)) {
    return { error: "Selecciona un tipo de documento válido." };
  }
  if (typeof instructions !== "string" || instructions.trim().length === 0) {
    return { error: "Describe qué debe contener el documento." };
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

  let data: DocumentoResult;
  let provider: string;
  let model: string;
  let tokensUsed: number | null;
  try {
    const generated = await generateStructured(
      buildDocumentoPrompt(type, instructions),
      documentoResultSchema,
      { system: "Eres un asistente experto en redactar documentos profesionales en español." },
    );
    data = generated.data;
    provider = generated.result.provider;
    model = generated.result.model;
    tokensUsed = generated.result.tokensUsed;
  } catch (error) {
    console.error("[Documentos] Error al generar documento:", error);
    return { error: "No se pudo generar el documento. Inténtalo nuevamente." };
  }

  let buffer: Buffer;
  try {
    buffer = await buildDocumentoDocx(data);
  } catch (error) {
    console.error("[Documentos] Error al construir el DOCX:", error);
    return { error: "El documento se generó pero no se pudo empaquetar como DOCX." };
  }

  const safeName = data.title.replace(/[^\w.\-]+/g, "_").slice(0, 80) || type;
  const storagePath = `${user.id}/generados/${crypto.randomUUID()}-${safeName}.docx`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

  if (uploadError) {
    return { error: "No se pudo guardar el documento generado." };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    user_id: user.id,
    name: data.title,
    original_filename: `${safeName}.docx`,
    file_type: "docx",
    storage_path: storagePath,
    status: "uploaded",
  });

  if (insertError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return { error: "No se pudo registrar el documento generado." };
  }

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "generador-documentos",
    input: `[${type}] ${instructions.slice(0, 200)}`,
    result: { title: data.title },
    provider,
    model,
    tokens_used: tokensUsed,
  });

  const { data: signed, error: signError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (signError || !signed) {
    return { error: "El documento se guardó, pero no se pudo generar el enlace de descarga. Revísalo en Mis documentos." };
  }

  revalidatePath("/documents");

  return { result: { ...data, downloadUrl: signed.signedUrl } };
}
