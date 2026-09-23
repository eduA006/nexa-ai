import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/dal";
import { canAccessTool } from "@/lib/config/plans";
import { UpgradePrompt } from "@/components/plans/upgrade-prompt";

/** Envuelve una página de herramienta Pro: renderiza `children` solo si el usuario tiene acceso. */
export async function ProGate({
  slug,
  toolName,
  children,
}: {
  slug: string;
  toolName: string;
  children: ReactNode;
}) {
  const session = await getCurrentUser();
  if (!canAccessTool(slug, session?.profile)) {
    return <UpgradePrompt toolName={toolName} />;
  }
  return <>{children}</>;
}
