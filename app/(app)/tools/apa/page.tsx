import { getUserDocuments } from "@/lib/documents/queries";
import { ApaForm } from "@/components/tools/apa-form";

export default async function ApaToolPage() {
  const documents = await getUserDocuments();
  const docxDocuments = documents.filter((doc) => doc.file_type === "docx");

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Corrector APA 7</h1>
        <p className="text-muted-foreground">
          Analiza un documento DOCX y recibe un diagnóstico de formato (reglas
          automáticas) y redacción (IA).
        </p>
      </div>

      <ApaForm documents={docxDocuments} />
    </div>
  );
}
