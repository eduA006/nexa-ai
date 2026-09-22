"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateFile } from "@/lib/documents/validate";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";

const BUCKET = "documents";

export type UploadActionState = { error: string } | undefined;

export async function uploadDocument(
  _prevState: UploadActionState,
  formData: FormData,
): Promise<UploadActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfTodayIso());

  if ((count ?? 0) >= LIMITS.MAX_DOCUMENTS_PER_DAY) {
    return { error: "Has alcanzado el límite diario gratuito de documentos." };
  }

  const validation = await validateFile(file, LIMITS.MAX_FILE_SIZE_MB);
  if (!validation.ok) {
    return { error: validation.error };
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });

  if (uploadError) {
    return { error: "No se pudo subir el archivo. Inténtalo nuevamente." };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    user_id: user.id,
    name: file.name,
    original_filename: file.name,
    file_type: validation.type,
    storage_path: storagePath,
    status: "uploaded",
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: "No se pudo registrar el documento. Inténtalo nuevamente." };
  }

  revalidatePath("/documents");
  return undefined;
}

export async function deleteDocument(documentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (doc) {
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    await supabase.from("documents").delete().eq("id", documentId).eq("user_id", user.id);
  }

  revalidatePath("/documents");
}

export async function getDownloadUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error) return null;
  return data.signedUrl;
}
