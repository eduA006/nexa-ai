import "server-only";
import { parseSpreadsheet, type SpreadsheetSummary } from "@/lib/documents/extract/spreadsheet";
import { generateStructured } from "@/lib/ai/service";
import { excelAiResultSchema, buildExcelAnalysisPrompt } from "@/lib/ai/prompts/excel";

export type ExcelAnalysisResult = {
  headers: string[];
  rowCount: number;
  columnStats: SpreadsheetSummary["columnStats"];
  aiSummary: string;
  trends: string[];
  notableFindings: string[];
  provider: string;
  model: string;
  tokensUsed: number | null;
};

/**
 * Estadísticas por columna (conteo, suma, promedio, min, max,
 * cardinalidad) son deterministas (`lib/documents/extract/spreadsheet.ts`).
 * La IA solo redacta una narrativa de tendencias e inconsistencias sobre
 * esas estadísticas ya calculadas — nunca las recalcula ni inventa cifras.
 */
export async function analyzeSpreadsheet(
  buffer: Buffer,
  fileType: "xlsx" | "csv",
): Promise<ExcelAnalysisResult> {
  const summary = parseSpreadsheet(buffer, fileType);

  const { data: aiResult, result } = await generateStructured(
    buildExcelAnalysisPrompt(summary),
    excelAiResultSchema,
    { system: "Eres un analista de datos experto que interpreta hojas de cálculo en español." },
  );

  return {
    headers: summary.headers,
    rowCount: summary.rowCount,
    columnStats: summary.columnStats,
    aiSummary: aiResult.summary,
    trends: aiResult.trends,
    notableFindings: aiResult.notableFindings,
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
}
