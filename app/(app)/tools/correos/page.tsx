import { CorreosForm } from "@/components/tools/correos-form";

export default function CorreosToolPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Asistente de correos</h1>
        <p className="text-muted-foreground">
          Redacta, mejora, resume o cambia el tono de un correo.
        </p>
      </div>

      <CorreosForm />
    </div>
  );
}
