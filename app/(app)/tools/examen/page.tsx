import type { Metadata } from "next";
import { getUserDocuments } from "@/lib/documents/queries";
import { ExamenForm } from "@/components/tools/examen-form";

export const metadata: Metadata = { title: "Simulador de exámenes" };

export default async function ExamenToolPage() {
  const documents = await getUserDocuments();
  const docxDocuments = documents.filter((doc) => doc.file_type === "docx");

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Simulador de exámenes</h1>
        <p className="text-muted-foreground">
          Genera un examen de práctica a partir de tu documento y recibe
          retroalimentación al calificarlo.
        </p>
      </div>

      <ExamenForm documents={docxDocuments} />
    </div>
  );
}
