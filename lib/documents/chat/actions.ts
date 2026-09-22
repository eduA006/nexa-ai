"use server";

import { revalidatePath } from "next/cache";
import mammoth from "mammoth";
import { createClient } from "@/lib/supabase/server";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";
import { generateText } from "@/lib/ai/service";
import {
  buildDocumentChatPrompt,
  DOCUMENT_CHAT_SYSTEM_PROMPT,
  type ChatTurn,
} from "@/lib/ai/prompts/document-chat";
import type { ChatMessage } from "@/lib/documents/chat/queries";

export type ChatActionState = { error: string } | { messages: ChatMessage[] } | undefined;


export async function sendChatMessage(
  documentId: string,
  _prevState: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  const question = formData.get("question");
  if (typeof question !== "string" || question.trim().length === 0) {
    return { error: "Escribe una pregunta." };
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
    return { error: "El chat con documentos solo admite documentos DOCX por ahora." };
  }

  const { data: history } = await supabase
    .from("document_chat_messages")
    .select("role, content")
    .eq("document_id", documentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);

  if (downloadError || !fileBlob) {
    return { error: "No se pudo descargar el documento." };
  }

  let answer: string;
  let provider: string;
  let model: string;
  let tokensUsed: number | null;
  try {
    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const { value: documentText } = await mammoth.extractRawText({ buffer });
    const prompt = buildDocumentChatPrompt(
      documentText,
      (history ?? []) as ChatTurn[],
      question.trim(),
    );
    const result = await generateText(prompt, { system: DOCUMENT_CHAT_SYSTEM_PROMPT });
    answer = result.text.trim();
    provider = result.provider;
    model = result.model;
    tokensUsed = result.tokensUsed;
  } catch (error) {
    console.error("[DocumentChat] Error al generar respuesta:", error);
    return { error: "No se pudo generar una respuesta. Inténtalo nuevamente." };
  }

  await supabase.from("document_chat_messages").insert([
    { document_id: documentId, user_id: user.id, role: "user", content: question.trim() },
    { document_id: documentId, user_id: user.id, role: "assistant", content: answer },
  ]);

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "chat-documento",
    input: doc.name,
    result: { question: question.trim(), answer },
    provider,
    model,
    tokens_used: tokensUsed,
  });

  revalidatePath(`/tools/chat-documento`);

  const { data: updatedMessages } = await supabase
    .from("document_chat_messages")
    .select("*")
    .eq("document_id", documentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return { messages: updatedMessages ?? [] };
}
