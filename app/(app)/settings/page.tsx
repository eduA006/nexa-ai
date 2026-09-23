import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Zap, Crown, Check } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleForm } from "@/components/settings/role-form";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { PaymentForm } from "@/components/plans/payment-form";
import { ALL_TOOLS } from "@/components/tools/catalog";
import { hasProAccess, isProTool } from "@/lib/config/plans";
import { getLatestPaymentRequest } from "@/lib/payments/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const isPro = hasProAccess(session.profile);
  const freeTools = ALL_TOOLS.filter((tool) => !isProTool(tool.slug));
  const proTools = ALL_TOOLS.filter((tool) => isProTool(tool.slug));
  const latestPaymentRequest = await getLatestPaymentRequest();

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

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Plan</CardTitle>
          <CardDescription>
            {isPro
              ? `Tienes Pro activo hasta el ${
                  session.profile?.pro_expires_at
                    ? new Date(session.profile.pro_expires_at).toLocaleDateString("es-PE", {
                        day: "numeric",
                        month: "long",
                      })
                    : "—"
                }.`
              : "Así se dividen las herramientas. Paga con Yape para activar Pro."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className={cn(
                "win98-well flex flex-col gap-3 bg-input p-4",
                !isPro && "ring-2 ring-primary ring-offset-2 ring-offset-card",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Zap className="h-4 w-4" />
                  Free
                </div>
                {!isPro && <Badge>Tu plan</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {freeTools.length} herramientas para estudiar y trabajar todos los días.
              </p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {freeTools.map((tool) => (
                  <li key={tool.slug} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{tool.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={cn(
                "win98-well flex flex-col gap-3 bg-input p-4",
                isPro && "ring-2 ring-primary ring-offset-2 ring-offset-card",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Crown className="h-4 w-4" />
                  Pro
                </div>
                {isPro ? <Badge>Tu plan</Badge> : <Badge variant="outline">S/ 5 / semana</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                Todo lo de Free, más las herramientas que generan un entregable real.
              </p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {proTools.map((tool) => (
                  <li key={tool.slug} className="flex items-start gap-1.5">
                    <tool.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{tool.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <PaymentForm latestRequest={latestPaymentRequest} />
          </div>
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
