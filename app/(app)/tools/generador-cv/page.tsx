import type { Metadata } from "next";
import { GeneradorCvForm } from "@/components/tools/generador-cv-form";
import { ProGate } from "@/components/plans/pro-gate";

export const metadata: Metadata = { title: "Generador de CV" };

export default function GeneradorCvToolPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Generador de CV</h1>
        <p className="text-muted-foreground">
          A partir de tus datos, experiencia y habilidades.
        </p>
      </div>

      <ProGate slug="generador-cv" toolName="Generador de CV">
        <GeneradorCvForm />
      </ProGate>
    </div>
  );
}
