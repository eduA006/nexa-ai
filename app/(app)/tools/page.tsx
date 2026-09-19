import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STUDENT_TOOLS, PROFESSIONAL_TOOLS } from "@/components/tools/catalog";

export default async function ToolsPage() {
  const session = await getCurrentUser();
  const role = session?.profile?.role ?? "student";
  const tools = role === "professional" ? PROFESSIONAL_TOOLS : STUDENT_TOOLS;

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Herramientas</h1>
        <p className="text-muted-foreground">
          Catálogo de herramientas planeadas para tu perfil. Se irán
          activando fase a fase — ver PLAN.md.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) =>
          tool.available ? (
            <Link key={tool.slug} href={`/tools/${tool.slug}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <tool.icon className="h-5 w-5" />
                  <CardTitle className="mt-2 text-base">{tool.name}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ) : (
            <Card key={tool.slug} className="opacity-80">
              <CardHeader>
                <tool.icon className="h-5 w-5" />
                <CardTitle className="mt-2 text-base">{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <Badge variant="secondary">Próximamente</Badge>
              </div>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}
