"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { runExcelAnalysis, type ExcelActionState } from "@/lib/tools/excel/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Document } from "@/lib/documents/queries";

export function ExcelForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<ExcelActionState, FormData>(
    runExcelAnalysis,
    undefined,
  );

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          name="documentId"
          required
          disabled={documents.length === 0}
          className="h-9 flex-1 rounded-md win98-well border border-input bg-input px-3 text-sm transition-shadow focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecciona un documento XLSX o CSV…</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          disabled={pending || documents.length === 0}
          className="transition-transform active:scale-[0.98]"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Analizando…" : "Analizar datos"}
        </Button>
      </form>

      {documents.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tienes documentos XLSX o CSV subidos. Sube uno en{" "}
          <a href="/documents" className="underline underline-offset-4">
            Mis documentos
          </a>
          .
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {result.rowCount} filas, {result.headers.length} columnas.
              </p>
              <p className="text-sm text-muted-foreground">{result.aiSummary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estadísticas por columna</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-1.5 pr-4">Columna</th>
                    <th className="py-1.5 pr-4">Tipo</th>
                    <th className="py-1.5 pr-4">Conteo</th>
                    <th className="py-1.5 pr-4">Promedio</th>
                    <th className="py-1.5 pr-4">Mín</th>
                    <th className="py-1.5 pr-4">Máx</th>
                    <th className="py-1.5 pr-4">Distintos</th>
                  </tr>
                </thead>
                <tbody>
                  {result.columnStats.map((col) => (
                    <tr key={col.name} className="border-b last:border-0">
                      <td className="py-1.5 pr-4 font-medium">{col.name}</td>
                      <td className="py-1.5 pr-4 text-muted-foreground">{col.type}</td>
                      <td className="py-1.5 pr-4 text-muted-foreground">{col.count}</td>
                      <td className="py-1.5 pr-4 text-muted-foreground">
                        {col.avg !== undefined ? col.avg.toFixed(2) : "—"}
                      </td>
                      <td className="py-1.5 pr-4 text-muted-foreground">{col.min ?? "—"}</td>
                      <td className="py-1.5 pr-4 text-muted-foreground">{col.max ?? "—"}</td>
                      <td className="py-1.5 pr-4 text-muted-foreground">{col.distinctCount ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {result.trends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tendencias</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {result.trends.map((trend, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-foreground">•</span>
                      {trend}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.notableFindings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos atípicos / a revisar</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {result.notableFindings.map((finding, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-foreground">•</span>
                      {finding}
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
