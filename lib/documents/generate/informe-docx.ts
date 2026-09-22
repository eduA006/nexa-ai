import "server-only";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";
import type { ColumnStat } from "@/lib/documents/extract/spreadsheet";

export type InformeDocxInput = {
  title: string;
  rowCount: number;
  columnStats: ColumnStat[];
  aiSummary: string;
  trends: string[];
  notableFindings: string[];
};

function headerCell(text: string): TableCell {
  return new TableCell({
    width: { size: 100 / 7, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
  });
}

function dataCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun(text)] })],
  });
}

function bulletParagraphs(items: string[]): Paragraph[] {
  return items.map((item) => new Paragraph({ text: `• ${item}` }));
}

/**
 * Construye un informe DOCX real (título, resumen, tabla de estadísticas
 * reales, tendencias, hallazgos) a partir del resultado ya calculado de
 * `analyzeSpreadsheet` — no recalcula ni inventa números, solo formatea
 * lo que ya se produjo de forma determinista + IA.
 */
export async function buildInformeDocx(input: InformeDocxInput): Promise<Buffer> {
  const statsRows = [
    new TableRow({
      children: ["Columna", "Tipo", "Conteo", "Suma", "Promedio", "Mín", "Máx"].map(headerCell),
    }),
    ...input.columnStats.map(
      (col) =>
        new TableRow({
          children: [
            dataCell(col.name),
            dataCell(col.type),
            dataCell(String(col.count)),
            dataCell(col.sum !== undefined ? col.sum.toFixed(2) : "—"),
            dataCell(col.avg !== undefined ? col.avg.toFixed(2) : "—"),
            dataCell(col.min !== undefined ? String(col.min) : "—"),
            dataCell(col.max !== undefined ? String(col.max) : "—"),
          ],
        }),
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: input.title, heading: HeadingLevel.TITLE }),
          new Paragraph({ text: "Resumen", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            text: `Datos analizados: ${input.rowCount} filas, ${input.columnStats.length} columnas.`,
          }),
          new Paragraph({ text: input.aiSummary }),
          new Paragraph({ text: "Estadísticas por columna", heading: HeadingLevel.HEADING_1 }),
          new Table({ rows: statsRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Tendencias", heading: HeadingLevel.HEADING_1 }),
          ...bulletParagraphs(input.trends),
          new Paragraph({ text: "Hallazgos y datos a revisar", heading: HeadingLevel.HEADING_1 }),
          ...bulletParagraphs(input.notableFindings),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
