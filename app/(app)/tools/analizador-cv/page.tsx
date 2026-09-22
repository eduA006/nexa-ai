import type { Metadata } from "next";
import { getUserDocuments } from "@/lib/documents/queries";
import { CvForm } from "@/components/tools/cv-form";

export const metadata: Metadata = { title: "Analizador de CV" };

export default async function CvToolPage() {
  const documents = await getUserDocuments();
  const docxDocuments = documents.filter((doc) => doc.file_type === "docx");

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Analizador de CV</h1>
        <p className="text-muted-foreground">
          Estructura, claridad, logros y consistencia de tu currículum.
        </p>
      </div>

      <CvForm documents={docxDocuments} />
    </div>
  );
}
