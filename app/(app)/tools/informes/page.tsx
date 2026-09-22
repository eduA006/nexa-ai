import { getUserDocuments } from "@/lib/documents/queries";
import { InformesForm } from "@/components/tools/informes-form";

export default async function InformesToolPage() {
  const documents = await getUserDocuments();
  const spreadsheetDocuments = documents.filter(
    (doc) => doc.file_type === "xlsx" || doc.file_type === "csv",
  );

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Generador de informes</h1>
        <p className="text-muted-foreground">
          De una hoja de datos (XLSX/CSV) a un informe DOCX con estadísticas y análisis.
        </p>
      </div>

      <InformesForm documents={spreadsheetDocuments} />
    </div>
  );
}
