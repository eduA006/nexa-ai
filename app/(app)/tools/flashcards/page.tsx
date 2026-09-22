import type { Metadata } from "next";
import { getUserDocuments } from "@/lib/documents/queries";
import { FlashcardsForm } from "@/components/tools/flashcards-form";

export const metadata: Metadata = { title: "Flashcards" };

export default async function FlashcardsToolPage() {
  const documents = await getUserDocuments();
  const docxDocuments = documents.filter((doc) => doc.file_type === "docx");

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Flashcards</h1>
        <p className="text-muted-foreground">
          Genera tarjetas de pregunta y respuesta a partir de tu documento para
          practicar recuerdo activo.
        </p>
      </div>

      <FlashcardsForm documents={docxDocuments} />
    </div>
  );
}
