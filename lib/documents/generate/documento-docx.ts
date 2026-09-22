import "server-only";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { DocumentoResult } from "@/lib/ai/prompts/documentos";

/**
 * Genera un DOCX real desde cero con la librería `docx` (ya usada en el
 * proyecto para pruebas y en Fase 7 no aplica aquí — esa manipula un
 * DOCX existente; esta crea uno nuevo). Sin dependencias adicionales.
 */
export async function buildDocumentoDocx(result: DocumentoResult): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      text: result.title,
      heading: HeadingLevel.TITLE,
    }),
  ];

  for (const section of result.sections) {
    if (section.heading.trim()) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_1,
        }),
      );
    }

    for (const paragraphText of section.content.split(/\n{2,}/)) {
      const trimmed = paragraphText.trim();
      if (!trimmed) continue;
      children.push(
        new Paragraph({
          children: [new TextRun(trimmed)],
        }),
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
