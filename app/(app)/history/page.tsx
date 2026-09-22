import { History, Sparkles, FileText } from "lucide-react";
import {
  getRecentAiSessions,
  getUsageSummary,
  getToolUsageCounts,
} from "@/lib/usage/queries";
import { getToolBySlug } from "@/components/tools/catalog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PROVIDER_LABEL: Record<string, string> = {
  gemini: "Gemini",
  groq: "Groq",
};

function usageBarClass(used: number, limit: number): string {
  const ratio = limit > 0 ? used / limit : 0;
  if (ratio >= 1) return "bg-destructive";
  if (ratio >= 0.75) return "bg-amber-500";
  return "bg-primary";
}

export default async function HistoryPage() {
  const [usage, sessions, toolCounts] = await Promise.all([
    getUsageSummary(),
    getRecentAiSessions(30),
    getToolUsageCounts(),
  ]);

  const topTools = toolCounts.slice(0, 5);

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8 md:px-10">
      <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Historial</h1>
        <p className="text-muted-foreground">
          Tu uso de herramientas de IA y documentos, de más reciente a más antiguo.
        </p>
      </div>

      <div
        className="grid gap-4 sm:grid-cols-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
      >
        <Card>
          <CardHeader>
            <Sparkles className="h-5 w-5" />
            <CardTitle className="mt-2 text-base">Solicitudes de IA hoy</CardTitle>
            <CardDescription>
              {usage.aiRequestsToday} de {usage.aiRequestsLimit} usadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-700 ${usageBarClass(usage.aiRequestsToday, usage.aiRequestsLimit)}`}
                style={{
                  width: `${Math.min(100, (usage.aiRequestsToday / Math.max(1, usage.aiRequestsLimit)) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <FileText className="h-5 w-5" />
            <CardTitle className="mt-2 text-base">Documentos subidos hoy</CardTitle>
            <CardDescription>
              {usage.documentsToday} de {usage.documentsLimit} usados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-700 ${usageBarClass(usage.documentsToday, usage.documentsLimit)}`}
                style={{
                  width: `${Math.min(100, (usage.documentsToday / Math.max(1, usage.documentsLimit)) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {topTools.length > 0 && (
        <section
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "140ms", animationFillMode: "backwards" }}
        >
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Herramientas más utilizadas
          </h2>
          <div className="flex flex-wrap gap-2">
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
          </div>
        </section>
      )}

      <section
        className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
      >
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Actividad reciente
        </h2>

        {sessions.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="items-center text-center">
              <History className="h-5 w-5" />
              <CardTitle className="mt-2 text-base">Sin actividad todavía</CardTitle>
              <CardDescription>
                Cuando uses una herramienta de IA, aparecerá aquí.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((session, index) => {
              const info = getToolBySlug(session.tool);
              const Icon = info?.icon ?? History;
              return (
                <Card
                  key={session.id}
                  className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                  style={{
                    animationDelay: `${index * 20}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {info?.name ?? session.tool}
                        </p>
                        {session.input && (
                          <p className="truncate text-sm text-muted-foreground">
                            {session.input}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="outline">
                        {PROVIDER_LABEL[session.provider] ?? session.provider}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleString("es-PE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
