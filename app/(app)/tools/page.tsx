import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STUDENT_TOOLS, PROFESSIONAL_TOOLS, groupByCategory } from "@/components/tools/catalog";

export const metadata: Metadata = { title: "Herramientas" };

export default async function ToolsPage() {
  const session = await getCurrentUser();
  const role = session?.profile?.role ?? "student";
  const tools = role === "professional" ? PROFESSIONAL_TOOLS : STUDENT_TOOLS;
  const categories = groupByCategory(tools);

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Herramientas</h1>
        <p className="text-muted-foreground">
          Catálogo completo de herramientas disponibles para tu perfil.
        </p>
      </div>

      {categories.map(({ category, tools: categoryTools }) => (
        <section key={category} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {category}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTools.map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                <Card className="h-full hover:bg-muted/50">
                  <CardHeader>
                    <tool.icon className="h-5 w-5" />
                    <CardTitle className="mt-2 text-base">{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
