import { getUserDocuments } from "@/lib/documents/queries";
import { PresentacionesForm } from "@/components/tools/presentaciones-form";

export default async function PresentacionesToolPage() {
  const documents = await getUserDocuments();
  const docxDocuments = documents.filter((doc) => doc.file_type === "docx");

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Generador de presentaciones</h1>
        <p className="text-muted-foreground">
          Estructura de diapositivas (título, puntos y notas de orador) a partir de tu
          documento.
        </p>
      </div>

      <PresentacionesForm documents={docxDocuments} />
    </div>
  );
}
