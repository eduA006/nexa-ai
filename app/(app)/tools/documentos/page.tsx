import type { Metadata } from "next";
import { DocumentosForm } from "@/components/tools/documentos-form";

export const metadata: Metadata = { title: "Generador de documentos" };

export default function DocumentosToolPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Generador de documentos</h1>
        <p className="text-muted-foreground">
          Informes, memorandos, cartas y propuestas a partir de tus instrucciones.
        </p>
      </div>

      <DocumentosForm />
    </div>
  );
}
