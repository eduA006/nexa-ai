"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { runReunionSummary, type ReunionActionState } from "@/lib/tools/reuniones/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReunionesForm() {
  const [state, action, pending] = useActionState<ReunionActionState, FormData>(
    runReunionSummary,
    undefined,
  );

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="text">Transcripción o notas de la reunión</Label>
          <textarea
            id="text"
            name="text"
            required
            rows={12}
            placeholder="Pega aquí la transcripción o tus notas de la reunión…"
            className="w-full rounded-md border border-input bg-transparent p-3 text-sm transition-shadow focus-visible:shadow-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-fit transition-transform active:scale-[0.98]"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Procesando…" : "Resumir reunión"}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          {result.decisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decisiones</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {result.decisions.map((decision, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-foreground">•</span>
                      {decision}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tareas pendientes</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {result.actionItems.map((item, index) => (
                  <div key={index} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{item.task}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">Responsable: {item.owner}</Badge>
                      <Badge variant="secondary">Fecha: {item.dueDate}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.keyPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Otros puntos relevantes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {result.keyPoints.map((point, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-foreground">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
