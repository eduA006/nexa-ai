import { getUserDocuments } from "@/lib/documents/queries";
import { AnalizadorDocumentosForm } from "@/components/tools/analizador-documentos-form";

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

      <AnalizadorDocumentosForm documents={docxDocuments} />
    </div>
  );
}
