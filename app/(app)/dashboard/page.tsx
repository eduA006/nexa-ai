import Link from "next/link";
import { FileText, Clock, Wrench, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { getUserDocuments } from "@/lib/documents/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RECOMMENDED_TOOLS } from "@/components/tools/catalog";

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
  const recentDocuments = (await getUserDocuments()).slice(0, 3);

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
            <CardDescription>
              Aquí verás el historial de tus análisis y documentos generados
              cuando esta función esté disponible.
            </CardDescription>
          </CardHeader>
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
          <CardDescription>
            Se mostrarán aquí una vez que empieces a usar herramientas de IA.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card
        className="border-dashed animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "340ms", animationFillMode: "backwards" }}
      >
        <CardHeader className="items-center text-center">
          <Sparkles className="h-5 w-5" />
          <CardTitle className="mt-2 text-base">
            El dashboard sigue en construcción
          </CardTitle>
          <CardDescription>
            Estas secciones se irán activando a medida que se completen las
            fases del proyecto (ver PLAN.md).
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
