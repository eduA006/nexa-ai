import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleForm } from "@/components/settings/role-form";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { ALL_TOOLS } from "@/components/tools/catalog";
import { hasProAccess, isProTool } from "@/lib/config/plans";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const isPro = hasProAccess(session.profile?.plan);
  const proTools = ALL_TOOLS.filter((tool) => isProTool(tool.slug));

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
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Plan</CardTitle>
            <Badge variant={isPro ? "default" : "secondary"}>{isPro ? "Pro" : "Free"}</Badge>
          </div>
          <CardDescription>
            {isPro
              ? "Tienes acceso a todas las herramientas, incluidas las Pro."
              : "El plan de pago todavía no está activo — por ahora estas herramientas quedan reservadas para cuentas Pro:"}
          </CardDescription>
        </CardHeader>
        {!isPro && (
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {proTools.map((tool) => (
                <li key={tool.slug}>
                  <Badge variant="outline">{tool.name}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
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
