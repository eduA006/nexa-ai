import type { Metadata } from "next";
import { getUserDocuments } from "@/lib/documents/queries";
import { ExposicionesForm } from "@/components/tools/exposiciones-form";

export const metadata: Metadata = { title: "Preparador de exposiciones" };

export default async function ExposicionesToolPage() {
  const documents = await getUserDocuments();
  const docxDocuments = documents.filter((doc) => doc.file_type === "docx");

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Preparador de exposiciones</h1>
        <p className="text-muted-foreground">
          Estructura, guion y posibles preguntas para presentar tu trabajo.
        </p>
      </div>

      <ExposicionesForm documents={docxDocuments} />
    </div>
  );
}
