import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STUDENT_TOOLS, PROFESSIONAL_TOOLS, groupByCategory } from "@/components/tools/catalog";
import { ToolFolders } from "@/components/tools/tool-folders";
import { isProTool, hasProAccess } from "@/lib/config/plans";

export const metadata: Metadata = { title: "Herramientas" };

export default async function ToolsPage() {
  const session = await getCurrentUser();
  const role = session?.profile?.role ?? "student";
  const isPro = hasProAccess(session?.profile);
  const tools = role === "professional" ? PROFESSIONAL_TOOLS : STUDENT_TOOLS;
  const categories = groupByCategory(tools);

  // Los íconos son referencias a componentes (funciones) y no se pueden pasar
  // como prop de un Server Component a uno cliente — se renderizan aquí y se
  // pasa el JSX ya resuelto (sí serializable) a <ToolFolders>.
  const folders = categories.map((cat) => ({
    category: cat.category,
    count: cat.tools.length,
    content: (
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {cat.tools.map((tool) => (
          <Link key={tool.slug} href={`/tools/${tool.slug}`}>
            <Card className="h-full hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <tool.icon className="h-5 w-5" />
                  {isProTool(tool.slug) && !isPro && <Badge variant="secondary">Pro</Badge>}
                </div>
                <CardTitle className="mt-2 text-base">{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    ),
  }));

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Herramientas</h1>
        <p className="text-muted-foreground">
          Haz clic en una carpeta para ver las herramientas de esa categoría.
        </p>
      </div>

      <ToolFolders folders={folders} />
    </div>
  );
}
