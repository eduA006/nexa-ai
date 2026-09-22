import { ReferenciasApaForm } from "@/components/tools/referencias-apa-form";

export default function ReferenciasApaToolPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Generador de referencias APA</h1>
        <p className="text-muted-foreground">
          A partir de un DOI, URL, libro, artículo o tesis. Formato determinista (sin
          IA) según las reglas de APA 7.
        </p>
      </div>

      <ReferenciasApaForm />
    </div>
  );
}
