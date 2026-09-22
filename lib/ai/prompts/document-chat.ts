const MAX_DOCUMENT_CHARS = 12000;
const MAX_HISTORY_MESSAGES = 10;

export type ChatTurn = { role: "user" | "assistant"; content: string };

export const DOCUMENT_CHAT_SYSTEM_PROMPT =
  "Eres un asistente que responde preguntas basándote únicamente en el contenido de un documento proporcionado. " +
  "Si la respuesta no está en el documento, dilo explícitamente en vez de inventar información. " +
  "Responde en español, de forma clara y directa.";

export function buildDocumentChatPrompt(
  documentText: string,
  history: ChatTurn[],
  question: string,
): string {
  const truncatedDoc =
    documentText.length > MAX_DOCUMENT_CHARS
      ? `${documentText.slice(0, MAX_DOCUMENT_CHARS)}\n[...documento truncado por longitud...]`
      : documentText;

  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
  const historyText = recentHistory
    .map((turn) => `${turn.role === "user" ? "Usuario" : "Asistente"}: ${turn.content}`)
    .join("\n");

  return `Documento:
"""
${truncatedDoc}
"""
${historyText ? `\nConversación previa:\n${historyText}\n` : ""}
Pregunta del usuario: ${question}

Responde únicamente con el texto de tu respuesta, sin JSON ni formato adicional.`;
}
