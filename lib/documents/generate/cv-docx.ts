import "server-only";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip,
} from "docx";
import type { GeneratedCv } from "@/lib/ai/prompts/generador-cv";

const INK = "1F2937"; // texto principal, casi negro
const MUTED = "6B7280"; // fechas, contacto — gris secundario
const ACCENT = "1E3A5F"; // encabezados de sección — azul oscuro profesional

const BODY_SIZE = 21; // 10.5pt, en half-points
const NAME_SIZE = 52; // 26pt

const RIGHT_ALIGNED_TAB = { tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] };

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 3 },
    },
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, color: ACCENT, size: 22 }),
    ],
  });
}

/** Línea "Título en negrita — a la izquierda" con la fecha alineada al margen derecho. */
function entryHeaderLine(boldText: string, rightText: string): Paragraph {
  return new Paragraph({
    tabStops: RIGHT_ALIGNED_TAB.tabStops,
    spacing: { before: 160 },
    children: [
      new TextRun({ text: boldText, bold: true, size: BODY_SIZE, color: INK }),
      new TextRun({ text: `\t${rightText}`, italics: true, size: BODY_SIZE - 1, color: MUTED }),
    ],
  });
}

function subLine(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: BODY_SIZE - 1, color: MUTED })],
  });
}

function bulletLine(text: string): Paragraph {
  return new Paragraph({
    indent: { left: convertInchesToTwip(0.2) },
    spacing: { before: 40 },
    children: [new TextRun({ text: `•  ${text}`, size: BODY_SIZE, color: INK })],
  });
}

/**
 * Genera un DOCX con estructura de CV profesional (encabezado con
 * nombre y contacto, secciones con línea divisoria, fechas alineadas
 * al margen derecho) desde cero con la librería `docx` (mismo patrón
 * que documento-docx.ts e informe-docx.ts). No agrega ni inventa
 * ningún dato: solo da formato al JSON estructurado que ya arma
 * runGeneradorCv().
 */
export async function buildCvDocx(cv: GeneratedCv): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: cv.fullName, bold: true, size: NAME_SIZE, color: INK })],
    }),
    new Paragraph({
      spacing: { before: 40, after: 160 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: MUTED, space: 6 },
      },
      children: [new TextRun({ text: cv.headerLine, size: BODY_SIZE, color: MUTED })],
    }),
  ];

  if (cv.profile.trim()) {
    children.push(
      sectionHeading("Perfil profesional"),
      new Paragraph({
        children: [new TextRun({ text: cv.profile, size: BODY_SIZE, color: INK })],
      }),
    );
  }

  if (cv.experience.length > 0) {
    children.push(sectionHeading("Experiencia"));
    for (const exp of cv.experience) {
      children.push(entryHeaderLine(exp.role, exp.period), subLine(exp.company));
      for (const bullet of exp.bullets) {
        children.push(bulletLine(bullet));
      }
    }
  }

  if (cv.education.length > 0) {
    children.push(sectionHeading("Educación"));
    for (const edu of cv.education) {
      children.push(entryHeaderLine(edu.degree, edu.period), subLine(edu.institution));
    }
  }

  if (cv.skills.length > 0) {
    children.push(
      sectionHeading("Habilidades"),
      new Paragraph({
        children: [new TextRun({ text: cv.skills.join("   ·   "), size: BODY_SIZE, color: INK })],
      }),
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: BODY_SIZE, color: INK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.7),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
