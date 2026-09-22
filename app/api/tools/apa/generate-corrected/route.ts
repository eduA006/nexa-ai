import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applyDocxFormatFixes } from "@/lib/documents/generate/docx-corrections";

const DOCUMENTS_BUCKET = "documents";

/**
 * Ruta API en vez de Server Action: la invocación directa de un Server
 * Action desde un event handler resultó poco fiable en esta versión de
 * Next.js (ver historial en PLAN.md, Fase 13/14) — un fetch normal a
 * una ruta estable no depende del mecanismo de despacho ni de IDs de
 * acción que rotan entre recompilaciones.
 *
 * Aplica las correcciones de formato deterministas (márgenes,
 * interlineado, sangría, fuente/tamaño) y sube el DOCX corregido a
 * Storage. No corrige numeración de página, referencias, ni contenido
 * de redacción — eso requiere revisión humana.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const documentId = typeof body?.documentId === "string" ? body.documentId : null;
  if (!documentId) {
    return NextResponse.json({ error: "Falta documentId." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sesión expirada. Vuelve a iniciar sesión." }, { status: 401 });
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("storage_path, file_type, original_filename")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  }
  if (doc.file_type !== "docx") {
    return NextResponse.json(
      { error: "Solo se pueden generar correcciones para documentos DOCX." },
      { status: 400 },
    );
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(doc.storage_path);

  if (downloadError || !fileBlob) {
    return NextResponse.json({ error: "No se pudo descargar el documento original." }, { status: 500 });
  }

  let correctedBuffer: Buffer;
  try {
    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    correctedBuffer = await applyDocxFormatFixes(buffer);
  } catch (error) {
    console.error("[APA] Error al generar DOCX corregido:", error);
    return NextResponse.json({ error: "No se pudo generar el documento corregido." }, { status: 500 });
  }

  const correctedPath = `${user.id}/corregidos/${crypto.randomUUID()}-corregido-${doc.original_filename}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(correctedPath, correctedBuffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

  if (uploadError) {
    return NextResponse.json({ error: "No se pudo guardar el documento corregido." }, { status: 500 });
  }

  await supabase
    .from("documents")
    .update({ processed_storage_path: correctedPath, status: "processed" })
    .eq("id", documentId)
    .eq("user_id", user.id);

  revalidatePath("/documents");

  // `download` fuerza Content-Disposition: attachment — sin esto, el
  // navegador intenta mostrar el archivo inline y, como no sabe
  // renderizar un .docx, la pestaña queda en blanco sin descargar nada.
  const { data: signed, error: signError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(correctedPath, 60, { download: `corregido-${doc.original_filename}` });

  if (signError || !signed) {
    return NextResponse.json({ error: "No se pudo generar el enlace de descarga." }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
