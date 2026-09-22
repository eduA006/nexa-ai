import type { Metadata } from "next";
import { ReunionesForm } from "@/components/tools/reuniones-form";

export const metadata: Metadata = { title: "Resumen de reuniones" };

export default function ReunionesToolPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Resumen de reuniones</h1>
        <p className="text-muted-foreground">
          Decisiones, tareas, responsables y fechas a partir de una transcripción o notas.
        </p>
      </div>

      <ReunionesForm />
    </div>
  );
}
