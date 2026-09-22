import Link from "next/link";
import { FileText, Clock, Wrench } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { getUserDocuments } from "@/lib/documents/queries";
import { getRecentAiSessions, getToolUsageCounts } from "@/lib/usage/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RECOMMENDED_TOOLS, getToolBySlug } from "@/components/tools/catalog";

const TYPE_LABEL: Record<string, string> = {
  pdf: "PDF",
  docx: "DOCX",
  xlsx: "XLSX",
  csv: "CSV",
};

function greetingName(fullName: string | null | undefined, email: string | undefined) {
  if (fullName) return fullName.trim().split(/\s+/)[0];
  if (!email) return "";
  const alias = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return alias.charAt(0).toUpperCase() + alias.slice(1);
}

export default async function DashboardPage() {
  const session = await getCurrentUser();
  const profile = session?.profile;
  const displayName = greetingName(profile?.full_name, session?.user.email);
  const recommended = RECOMMENDED_TOOLS[profile?.role ?? "student"];
  const [recentDocuments, recentSessions, toolCounts] = await Promise.all([
    getUserDocuments().then((docs) => docs.slice(0, 3)),
    getRecentAiSessions(4),
    getToolUsageCounts(),
  ]);
  const topTools = toolCounts.slice(0, 3);

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {displayName} 👋
        </h1>
        <p className="text-muted-foreground">¿Qué necesitas hacer hoy?</p>
      </div>

      <section
        className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
      >
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Herramientas recomendadas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((tool, index) =>
            tool.available ? (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                style={{
                  animationDelay: `${140 + index * 60}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:bg-muted/50 hover:shadow-md">
                  <CardHeader>
                    <tool.icon className="h-5 w-5" />
                    <CardTitle className="mt-2 text-base">{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ) : (
              <Card
                key={tool.slug}
                className="animate-in fade-in-0 slide-in-from-bottom-2 opacity-80 duration-500"
                style={{
                  animationDelay: `${140 + index * 60}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <CardHeader>
                  <tool.icon className="h-5 w-5" />
                  <CardTitle className="mt-2 text-base">{tool.name}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">Próximamente</Badge>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>

      <div
        className="grid gap-4 lg:grid-cols-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "220ms", animationFillMode: "backwards" }}
      >
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <FileText className="h-5 w-5" />
            <CardTitle className="mt-2 text-base">
              Mis documentos recientes
            </CardTitle>
            {recentDocuments.length === 0 && (
              <CardDescription>
                Aún no has subido documentos.{" "}
                <Link href="/documents" className="underline underline-offset-4">
                  Sube el primero
                </Link>
                .
              </CardDescription>
            )}
          </CardHeader>
          {recentDocuments.length > 0 && (
            <CardContent className="flex flex-col gap-2">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{doc.name}</span>
                  <Badge variant="secondary">
                    {TYPE_LABEL[doc.file_type] ?? doc.file_type}
                  </Badge>
                </div>
              ))}
              <Link
                href="/documents"
                className="mt-1 text-sm text-muted-foreground underline underline-offset-4"
              >
                Ver todos
              </Link>
            </CardContent>
          )}
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <Clock className="h-5 w-5" />
            <CardTitle className="mt-2 text-base">Actividad reciente</CardTitle>
            {recentSessions.length === 0 && (
              <CardDescription>
                Aquí verás el historial de tus análisis y documentos generados
                cuando uses una herramienta de IA.
              </CardDescription>
            )}
          </CardHeader>
          {recentSessions.length > 0 && (
            <CardContent className="flex flex-col gap-2">
              {recentSessions.map((session) => {
                const info = getToolBySlug(session.tool);
                return (
                  <div key={session.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{info?.name ?? session.tool}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString("es-PE")}
                    </span>
                  </div>
                );
              })}
              <Link
                href="/history"
                className="mt-1 text-sm text-muted-foreground underline underline-offset-4"
              >
                Ver historial completo
              </Link>
            </CardContent>
          )}
        </Card>
      </div>

      <Card
        className="transition-shadow hover:shadow-md animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "280ms", animationFillMode: "backwards" }}
      >
        <CardHeader>
          <Wrench className="h-5 w-5" />
          <CardTitle className="mt-2 text-base">
            Herramientas más utilizadas
          </CardTitle>
          {topTools.length === 0 && (
            <CardDescription>
              Se mostrarán aquí una vez que empieces a usar herramientas de IA.
            </CardDescription>
          )}
        </CardHeader>
        {topTools.length > 0 && (
          <CardContent className="flex flex-wrap gap-2">
            {topTools.map(({ tool, count }) => {
              const info = getToolBySlug(tool);
              return (
                <Badge key={tool} variant="secondary" className="gap-1.5 py-1.5">
                  {info?.icon ? <info.icon className="h-3.5 w-3.5" /> : null}
                  {info?.name ?? tool}
                  <span className="text-muted-foreground">· {count}</span>
                </Badge>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
