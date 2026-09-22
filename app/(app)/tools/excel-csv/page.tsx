import type { Metadata } from "next";
import { getUserDocuments } from "@/lib/documents/queries";
import { ExcelForm } from "@/components/tools/excel-form";

export const metadata: Metadata = { title: "Analizador de Excel/CSV" };

export default async function ExcelToolPage() {
  const documents = await getUserDocuments();
  const spreadsheetDocuments = documents.filter(
    (doc) => doc.file_type === "xlsx" || doc.file_type === "csv",
  );

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Analizador de Excel/CSV</h1>
        <p className="text-muted-foreground">
          Resumen de datos, estadísticas y tendencias de tu hoja de cálculo.
        </p>
      </div>

      <ExcelForm documents={spreadsheetDocuments} />
    </div>
  );
}
