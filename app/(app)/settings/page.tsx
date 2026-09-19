import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleForm } from "@/components/settings/role-form";
import { ThemeToggle } from "@/components/settings/theme-toggle";

export default async function SettingsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Preferencias de tu cuenta.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Tipo de perfil</CardTitle>
          <CardDescription>
            Cambia entre estudiante y profesional en cualquier momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleForm currentRole={session.profile?.role ?? null} />
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Apariencia</CardTitle>
          <CardDescription>Elige el tema de la interfaz.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
