import Link from "next/link";
import { Lock } from "lucide-react";
import { RetroWindow } from "@/components/retro/title-bar";
import { buttonVariants } from "@/components/ui/button";

export function UpgradePrompt({ toolName }: { toolName: string }) {
  return (
    <RetroWindow
      title="Herramienta Pro"
      icon={<Lock className="h-3.5 w-3.5" />}
      className="mx-auto max-w-md"
    >
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{toolName} es una herramienta Pro</h2>
        <p className="text-sm text-muted-foreground">
          Esta herramienta está disponible solo para cuentas Pro. El plan de pago todavía no
          está activo — puedes ver el estado de tu plan en Ajustes.
        </p>
        <Link href="/settings" className={buttonVariants({ variant: "secondary", className: "mt-2" })}>
          Ver mi plan
        </Link>
      </div>
    </RetroWindow>
  );
}
