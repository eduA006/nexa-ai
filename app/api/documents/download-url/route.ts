import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "documents";

/**
 * Genera una URL firmada de descarga para un documento del usuario
 * autenticado. Ruta API en vez de Server Action: la invocación directa
 * de un Server Action desde un event handler resultó poco fiable en
 * esta versión de Next.js (ver historial en PLAN.md, Fase 13/14) — un
 * fetch normal a una ruta estable no depende del mecanismo de
 * despacho ni de IDs de acción que rotan entre recompilaciones.
 */
export async function GET(request: NextRequest) {
  const storagePath = request.nextUrl.searchParams.get("path");
  if (!storagePath) {
    return NextResponse.json({ error: "Falta el parámetro path." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
  }

  // Confirma que la ruta pertenece a un documento del usuario (original o
  // procesado) antes de firmar la URL — no basta con RLS de Storage como
  // única capa, ver auditoría de seguridad de la Fase 13. Dos consultas
  // separadas en vez de `.or()` para no interpolar storagePath (viene
  // del cliente) directo en un filtro PostgREST.
  const [{ data: asOriginal }, { data: asProcessed }] = await Promise.all([
    supabase
      .from("documents")
      .select("original_filename")
      .eq("user_id", user.id)
      .eq("storage_path", storagePath)
      .maybeSingle(),
    supabase
      .from("documents")
      .select("original_filename")
      .eq("user_id", user.id)
      .eq("processed_storage_path", storagePath)
      .maybeSingle(),
  ]);

  const owningDoc = asOriginal ?? asProcessed;
  if (!owningDoc) {
    return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  }

  // `download` fuerza Content-Disposition: attachment — sin esto, el
  // navegador intenta mostrar el archivo inline y, como no sabe
  // renderizar un .docx, la pestaña queda en blanco sin descargar nada.
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60, { download: owningDoc.original_filename });

  if (error || !data) {
    return NextResponse.json({ error: "No se pudo generar el enlace de descarga." }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
