import { redirect } from "next/navigation";
import { GraduationCap, Briefcase, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { setRole } from "@/lib/profile/actions";

export default async function OnboardingPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.profile?.role) redirect("/dashboard");

  const setRoleToDashboard = setRole.bind(null, "/dashboard");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-3">
        <Sparkles className="h-6 w-6" />
        <h1 className="text-2xl font-semibold tracking-tight">
          ¿Cómo utilizarás NEXA AI?
        </h1>
        <p className="text-muted-foreground">
          Puedes cambiar esto después desde configuración.
        </p>
      </div>

      <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
        <form action={setRoleToDashboard}>
          <input type="hidden" name="role" value="student" />
          <button
            type="submit"
            className="flex h-full w-full flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center transition-colors hover:bg-muted"
          >
            <GraduationCap className="h-8 w-8" />
            <span className="font-medium">Estudiante</span>
            <span className="text-sm text-muted-foreground">
              Revisa APA, analiza escritura, resume documentos y más.
            </span>
          </button>
        </form>

        <form action={setRoleToDashboard}>
          <input type="hidden" name="role" value="professional" />
          <button
            type="submit"
            className="flex h-full w-full flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center transition-colors hover:bg-muted"
          >
            <Briefcase className="h-8 w-8" />
            <span className="font-medium">Profesional</span>
            <span className="text-sm text-muted-foreground">
              Analiza CV, redacta correos, analiza Excel/CSV y más.
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
