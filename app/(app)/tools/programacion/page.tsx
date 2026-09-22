import { CodigoForm } from "@/components/tools/codigo-form";

export default function ProgramacionToolPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Ayudante de programación</h1>
        <p className="text-muted-foreground">
          Pega tu código y elige qué necesitas: explicar, corregir, mejorar o documentar.
        </p>
      </div>

      <CodigoForm />
    </div>
  );
}
