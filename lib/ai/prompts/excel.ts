import { z } from "zod";
import type { SpreadsheetSummary } from "@/lib/documents/extract/spreadsheet";

export const excelAiResultSchema = z.object({
  summary: z.string(),
  trends: z.array(z.string()).max(8),
  notableFindings: z.array(z.string()).max(8),
});

export type ExcelAiResult = z.infer<typeof excelAiResultSchema>;

const MAX_SAMPLE_ROWS_IN_PROMPT = 20;

export function buildExcelAnalysisPrompt(summary: SpreadsheetSummary): string {
  const statsText = summary.columnStats
    .map((col) => {
      if (col.type === "numeric") {
        return `- ${col.name} (numérica): ${col.count} valores, suma=${col.sum?.toFixed(2)}, promedio=${col.avg?.toFixed(2)}, mín=${col.min}, máx=${col.max}`;
      }
      return `- ${col.name} (texto): ${col.count} valores, ${col.distinctCount} valores distintos`;
    })
    .join("\n");

  const sampleText = JSON.stringify(summary.sampleRows.slice(0, MAX_SAMPLE_ROWS_IN_PROMPT), null, 0);

  return `Eres un analista de datos que interpreta una hoja de cálculo en español.

El archivo tiene ${summary.rowCount} filas y estas columnas con sus estadísticas YA CALCULADAS (no las recalcules, úsalas tal cual):
${statsText}

Muestra de hasta ${MAX_SAMPLE_ROWS_IN_PROMPT} filas (de un total de ${summary.rowCount}):
${sampleText}

Con base ÚNICAMENTE en estas estadísticas y la muestra de filas (nunca inventes cifras que no estén aquí):
- "summary": resumen de 2 a 4 oraciones sobre qué contienen los datos en general.
- "trends": hasta 8 tendencias o patrones observables (ej. relación entre columnas, concentración de valores, crecimiento/decrecimiento si hay una columna de fecha/período).
- "notableFindings": hasta 8 datos atípicos, inconsistencias o valores que llaman la atención (ej. un valor muy por encima del promedio, muchos valores vacíos, valores negativos donde no se esperarían).

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{
  "summary": "string",
  "trends": ["string", ...],
  "notableFindings": ["string", ...]
}`;
}
