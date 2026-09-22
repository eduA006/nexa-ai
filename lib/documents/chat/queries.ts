import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type ChatMessage = Tables<"document_chat_messages">;

export async function getChatMessages(documentId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("document_chat_messages")
    .select("*")
    .eq("document_id", documentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return data ?? [];
}
