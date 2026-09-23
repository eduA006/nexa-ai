import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GraduationCap, Briefcase } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { setRole } from "@/lib/profile/actions";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.profile?.role) redirect("/dashboard");

  const setRoleToDashboard = setRole.bind(null, "/dashboard");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <Logo className="h-10 w-10 animate-in zoom-in-50 duration-700" />
        <h1 className="text-2xl font-semibold tracking-tight">
          ¿Cómo utilizarás NEXA AI?
        </h1>
        <p className="text-muted-foreground">
          Puedes cambiar esto después desde configuración.
        </p>
      </div>

      <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
        <form
          action={setRoleToDashboard}
          className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500"
          style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
        >
          <input type="hidden" name="role" value="student" />
          <button
            type="submit"
            className="win98-panel flex h-full w-full flex-col items-center gap-3 bg-card p-8 text-center hover:bg-muted"
          >
            <GraduationCap className="h-8 w-8" />
            <span className="font-medium">Estudiante</span>
            <span className="text-sm text-muted-foreground">
              Revisa APA, analiza escritura, resume documentos y más.
            </span>
          </button>
        </form>

        <form
          action={setRoleToDashboard}
          className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500"
          style={{ animationDelay: "220ms", animationFillMode: "backwards" }}
        >
          <input type="hidden" name="role" value="professional" />
          <button
            type="submit"
            className="win98-panel flex h-full w-full flex-col items-center gap-3 bg-card p-8 text-center hover:bg-muted"
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
