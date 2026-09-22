"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { sendChatMessage, type ChatActionState } from "@/lib/documents/chat/actions";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { ChatMessage } from "@/lib/documents/chat/queries";

export function DocumentChat({
  documentId,
  initialMessages,
}: {
  documentId: string;
  initialMessages: ChatMessage[];
}) {
  const sendForDocument = sendChatMessage.bind(null, documentId);
  const [state, action, pending] = useActionState<ChatActionState, FormData>(
    sendForDocument,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = state && "messages" in state ? state.messages : initialMessages;
  const error = state && "error" in state ? state.error : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (state && "messages" in state) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex min-h-[320px] flex-1 flex-col gap-3 overflow-y-auto rounded-lg border p-4">
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-muted-foreground">
            Escribe una pregunta sobre el contenido de este documento para empezar.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[85%] animate-in fade-in-0 slide-in-from-bottom-1 rounded-lg px-3 py-2 text-sm duration-300",
                message.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start bg-muted",
              )}
            >
              {message.content}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form ref={formRef} action={action} className="flex gap-2">
        <input
          type="text"
          name="question"
          required
          placeholder="Pregunta algo sobre el documento…"
          disabled={pending}
          className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm transition-shadow focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button type="submit" disabled={pending} size="icon" aria-label="Enviar pregunta">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
