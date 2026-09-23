import Link from "next/link";
import { Crown, ArrowRight } from "lucide-react";
import { RetroWindow } from "@/components/retro/title-bar";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ALL_TOOLS } from "@/components/tools/catalog";
import { isProTool } from "@/lib/config/plans";

export function UpgradePrompt({ toolName }: { toolName: string }) {
  const otherProTools = ALL_TOOLS.filter((tool) => isProTool(tool.slug) && tool.name !== toolName);

  return (
    <RetroWindow
      title="Herramienta Pro"
      icon={<Crown className="h-3.5 w-3.5" />}
      className="mx-auto max-w-lg"
    >
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="win98-well flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-input">
          <Crown className="h-6 w-6 text-primary" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">{toolName} es Pro</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Esta herramienta está reservada para cuentas Pro. El cobro real todavía no está
            activo — puedes ver el estado de tu plan en Ajustes.
          </p>
        </div>

        {otherProTools.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">También son Pro:</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {otherProTools.map((tool) => (
                <Badge key={tool.slug} variant="outline">
                  {tool.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Link href="/settings" className={buttonVariants({ variant: "secondary", className: "mt-1" })}>
          Ver mi plan
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </RetroWindow>
  );
}
