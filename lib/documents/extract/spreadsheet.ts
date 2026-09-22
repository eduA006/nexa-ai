import "server-only";
import * as XLSX from "xlsx";

export type ColumnStat = {
  name: string;
  type: "numeric" | "texto";
  count: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  distinctCount?: number;
};

export type SpreadsheetSummary = {
  headers: string[];
  rowCount: number;
  columnStats: ColumnStat[];
  sampleRows: Record<string, unknown>[];
};

const MAX_SAMPLE_ROWS = 30;
const MAX_COLUMNS = 30;

function isNumericValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Extrae encabezados, filas y estadísticas básicas (conteo, suma,
 * promedio, min, max para columnas numéricas; cardinalidad para
 * columnas de texto) de un XLSX o CSV. Determinista, sin IA — la IA
 * solo redacta la narrativa de tendencias sobre estas estadísticas ya
 * calculadas (`lib/ai/prompts/excel.ts`), nunca inventa números.
 */
export function parseSpreadsheet(buffer: Buffer, fileType: "xlsx" | "csv"): SpreadsheetSummary {
  const workbook =
    fileType === "csv"
      ? XLSX.read(buffer.toString("utf-8"), { type: "string" })
      : XLSX.read(buffer, { type: "buffer" });

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  const headers = rows.length > 0 ? Object.keys(rows[0]).slice(0, MAX_COLUMNS) : [];

  const columnStats: ColumnStat[] = headers.map((name) => {
    const values = rows.map((row) => row[name]).filter((v) => v !== null && v !== undefined && v !== "");
    const numericValues = values.filter(isNumericValue);
    const isNumericColumn = values.length > 0 && numericValues.length / values.length >= 0.8;

    if (isNumericColumn && numericValues.length > 0) {
      const sum = numericValues.reduce((acc, v) => acc + v, 0);
      return {
        name,
        type: "numeric",
        count: numericValues.length,
        sum,
        avg: sum / numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
      };
    }

    return {
      name,
      type: "texto",
      count: values.length,
      distinctCount: new Set(values.map((v) => String(v))).size,
    };
  });

  return {
    headers,
    rowCount: rows.length,
    columnStats,
    sampleRows: rows.slice(0, MAX_SAMPLE_ROWS),
  };
}
