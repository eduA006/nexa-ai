import type { Metadata } from "next";
import { getUserDocuments } from "@/lib/documents/queries";
import { AnalizadorDocumentosForm } from "@/components/tools/analizador-documentos-form";
import { ProGate } from "@/components/plans/pro-gate";

export const metadata: Metadata = { title: "Analizador de documentos" };

export default async function AnalizadorDocumentosToolPage() {
  const documents = await getUserDocuments();
  const docxDocuments = documents.filter((doc) => doc.file_type === "docx");

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Analizador de documentos</h1>
        <p className="text-muted-foreground">
          Fechas, montos, personas y obligaciones clave de tu documento.
        </p>
      </div>

      <ProGate slug="analizador-documentos" toolName="Analizador de documentos">
        <AnalizadorDocumentosForm documents={docxDocuments} />
      </ProGate>
    </div>
  );
}
