import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/dal";
import { STUDENT_TOOLS, PROFESSIONAL_TOOLS, groupByCategory } from "@/components/tools/catalog";
import { ToolFolders } from "@/components/tools/tool-folders";

export const metadata: Metadata = { title: "Herramientas" };

export default async function ToolsPage() {
  const session = await getCurrentUser();
  const role = session?.profile?.role ?? "student";
  const tools = role === "professional" ? PROFESSIONAL_TOOLS : STUDENT_TOOLS;
  const categories = groupByCategory(tools);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Herramientas</h1>
        <p className="text-muted-foreground">
          Haz clic en una carpeta para ver las herramientas de esa categoría.
        </p>
      </div>

      <ToolFolders categories={categories} />
    </div>
  );
}
