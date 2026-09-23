import type { Metadata } from "next";
import { getUserDocuments } from "@/lib/documents/queries";
import { RiesgosContratosForm } from "@/components/tools/riesgos-contratos-form";
import { ProGate } from "@/components/plans/pro-gate";

export const metadata: Metadata = { title: "Analizador de riesgos y contratos" };

export default async function RiesgosContratosToolPage() {
  const documents = await getUserDocuments();
  const docxDocuments = documents.filter((doc) => doc.file_type === "docx");

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Analizador de riesgos y contratos</h1>
        <p className="text-muted-foreground">
          Identifica cláusulas con redacción atípica respecto a prácticas contractuales
          comunes. No sustituye la revisión de un abogado.
        </p>
      </div>

      <ProGate slug="riesgos-contratos" toolName="Analizador de riesgos y contratos">
        <RiesgosContratosForm documents={docxDocuments} />
      </ProGate>
    </div>
  );
}
