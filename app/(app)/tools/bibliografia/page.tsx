import { getUserDocuments } from "@/lib/documents/queries";
import { BibliografiaForm } from "@/components/tools/bibliografia-form";

export default async function BibliografiaToolPage() {
  const documents = await getUserDocuments();
  const docxDocuments = documents.filter((doc) => doc.file_type === "docx");

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Analizador de bibliografía</h1>
        <p className="text-muted-foreground">
          Compara las citas del texto contra la sección de referencias.
        </p>
      </div>

      <BibliografiaForm documents={docxDocuments} />
    </div>
  );
}
