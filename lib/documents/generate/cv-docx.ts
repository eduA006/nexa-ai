import "server-only";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import type { GeneratedCv } from "@/lib/ai/prompts/generador-cv";

/**
 * Genera un DOCX real desde cero con la librería `docx` (mismo patrón
 * que documento-docx.ts e informe-docx.ts), a partir del JSON
 * estructurado que ya arma runGeneradorCv(). No agrega ni inventa
 * ningún dato: solo da formato a lo que la IA ya generó.
 */
export async function buildCvDocx(cv: GeneratedCv): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      text: cv.fullName,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: cv.headerLine, color: "555555" })],
      alignment: AlignmentType.CENTER,
    }),
  ];

  if (cv.profile.trim()) {
    children.push(
      new Paragraph({ text: "Perfil profesional", heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ children: [new TextRun(cv.profile)] }),
    );
  }

  if (cv.experience.length > 0) {
    children.push(new Paragraph({ text: "Experiencia", heading: HeadingLevel.HEADING_1 }));
    for (const exp of cv.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.role} — ${exp.company}`, bold: true }),
            new TextRun({ text: ` (${exp.period})`, color: "555555" }),
          ],
        }),
      );
      for (const bullet of exp.bullets) {
        children.push(new Paragraph({ text: `• ${bullet}` }));
      }
    }
  }

  if (cv.education.length > 0) {
    children.push(new Paragraph({ text: "Educación", heading: HeadingLevel.HEADING_1 }));
    for (const edu of cv.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.degree} — ${edu.institution}`, bold: true }),
            new TextRun({ text: ` (${edu.period})`, color: "555555" }),
          ],
        }),
      );
    }
  }

  if (cv.skills.length > 0) {
    children.push(
      new Paragraph({ text: "Habilidades", heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: cv.skills.join(" · ") }),
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
