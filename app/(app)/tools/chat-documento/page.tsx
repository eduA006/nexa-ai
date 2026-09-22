import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { getUserDocuments } from "@/lib/documents/queries";
import { getChatMessages } from "@/lib/documents/chat/queries";
import { DocumentChat } from "@/components/tools/document-chat";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Chat con documento" };

export default async function DocumentChatPage({
  searchParams,
}: {
  searchParams: Promise<{ documentId?: string }>;
}) {
  const { documentId } = await searchParams;
  const documents = await getUserDocuments();
  const docxDocuments = documents.filter((doc) => doc.file_type === "docx");

  if (documentId) {
    const doc = docxDocuments.find((d) => d.id === documentId);
    if (!doc) notFound();

    const messages = await getChatMessages(documentId);

    return (
      <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
          <Link
            href="/tools/chat-documento"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            ← Elegir otro documento
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{doc.name}</h1>
          <p className="text-muted-foreground">
            Pregunta sobre el contenido de este documento. Las respuestas se basan
            únicamente en lo que contiene.
          </p>
        </div>

        <DocumentChat documentId={documentId} initialMessages={messages} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Chat con documentos</h1>
        <p className="text-muted-foreground">
          Elige un documento DOCX para empezar a preguntarle sobre su contenido.
        </p>
      </div>

      {docxDocuments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tienes documentos DOCX subidos. Sube uno en{" "}
          <Link href="/documents" className="underline underline-offset-4">
            Mis documentos
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docxDocuments.map((doc, index) => (
            <Link
              key={doc.id}
              href={`/tools/chat-documento?documentId=${doc.id}`}
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
            >
              <Card className="h-full hover:bg-muted/50">
                <CardHeader>
                  <MessagesSquare className="h-5 w-5" />
                  <CardTitle className="mt-2 truncate text-base">{doc.name}</CardTitle>
                  <CardDescription>Conversar sobre este documento</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
