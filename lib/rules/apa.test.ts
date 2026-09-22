import { describe, it, expect } from "vitest";
import {
  checkMargins,
  checkFontConsistency,
  checkLineSpacing,
  checkIndentation,
  checkPageNumbering,
  checkReferencesSection,
} from "@/lib/rules/apa";
import type { DocxStructure, DocxParagraph } from "@/lib/documents/extract/docx";

function paragraph(overrides: Partial<DocxParagraph> = {}): DocxParagraph {
  return {
    text: "Un párrafo de cuerpo con suficiente texto para el análisis.",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineSpacing: { line: 480, rule: "auto" },
    firstLineIndentTwips: 720,
    styleId: null,
    ...overrides,
  };
}

function structure(overrides: Partial<DocxStructure> = {}): DocxStructure {
  return {
    margins: { topIn: 1, bottomIn: 1, leftIn: 1, rightIn: 1 },
    paragraphs: [paragraph()],
    hasPageNumberingField: true,
    defaultFontFamily: "Times New Roman",
    defaultFontSizePt: 12,
    ...overrides,
  };
}

describe("checkMargins", () => {
  it("no reporta nada con márgenes correctos de 1 pulgada", () => {
    expect(checkMargins(structure())).toHaveLength(0);
  });

  it("reporta márgenes incorrectos", () => {
    const findings = checkMargins(
      structure({ margins: { topIn: 0.5, bottomIn: 1, leftIn: 1, rightIn: 1 } }),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].description).toContain("superior");
  });

  it("reporta warning si no se pudo determinar los márgenes", () => {
    const findings = checkMargins(structure({ margins: null }));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("warning");
  });
});

describe("checkFontConsistency", () => {
  it("no reporta nada con Times New Roman 12pt consistente", () => {
    expect(checkFontConsistency(structure())).toHaveLength(0);
  });

  it("detecta más de una fuente en el cuerpo", () => {
    const findings = checkFontConsistency(
      structure({
        paragraphs: [paragraph({ fontFamily: "Times New Roman" }), paragraph({ fontFamily: "Arial" })],
      }),
    );
    expect(findings.some((f) => f.type === "Tipografía")).toBe(true);
  });

  it("detecta un tamaño no aceptado para la fuente usada", () => {
    const findings = checkFontConsistency(
      structure({ paragraphs: [paragraph({ fontFamily: "Times New Roman", fontSizePt: 14 })] }),
    );
    expect(findings.some((f) => f.type === "Tamaño de fuente")).toBe(true);
  });

  it("ignora párrafos de encabezado (Heading/Title) al evaluar consistencia", () => {
    const findings = checkFontConsistency(
      structure({
        paragraphs: [paragraph(), paragraph({ fontFamily: "Comic Sans", styleId: "Heading1" })],
      }),
    );
    expect(findings).toHaveLength(0);
  });
});

describe("checkLineSpacing", () => {
  it("no reporta nada con interlineado doble en todos los párrafos", () => {
    expect(checkLineSpacing(structure())).toHaveLength(0);
  });

  it("detecta párrafos sin interlineado doble", () => {
    const findings = checkLineSpacing(
      structure({ paragraphs: [paragraph({ lineSpacing: { line: 240, rule: "auto" } })] }),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].affectedParagraphs).toEqual([1]);
  });
});

describe("checkIndentation", () => {
  it("no reporta nada con sangría de 0.5in", () => {
    expect(checkIndentation(structure())).toHaveLength(0);
  });

  it("detecta párrafos sin sangría correcta", () => {
    const findings = checkIndentation(
      structure({ paragraphs: [paragraph({ firstLineIndentTwips: 0 })] }),
    );
    expect(findings).toHaveLength(1);
  });
});

describe("checkPageNumbering", () => {
  it("no reporta nada si hay campo de numeración", () => {
    expect(checkPageNumbering(structure())).toHaveLength(0);
  });

  it("reporta si falta la numeración de página", () => {
    const findings = checkPageNumbering(structure({ hasPageNumberingField: false }));
    expect(findings).toHaveLength(1);
  });
});

describe("checkReferencesSection", () => {
  it("reporta error si hay citas pero no encabezado de Referencias", () => {
    const findings = checkReferencesSection(
      structure({ paragraphs: [paragraph({ text: "Un estudio (García, 2020) mostró esto." })] }),
    );
    expect(findings.some((f) => f.type === "Referencias" && f.severity === "error")).toBe(true);
  });

  it("no reporta error cuando hay citas y encabezado de Referencias", () => {
    const findings = checkReferencesSection(
      structure({
        paragraphs: [
          paragraph({ text: "Un estudio (García, 2020) mostró esto." }),
          paragraph({ text: "Referencias" }),
        ],
      }),
    );
    expect(findings.some((f) => f.type === "Referencias")).toBe(false);
  });

  it("informa cuando no hay ninguna cita detectada", () => {
    const findings = checkReferencesSection(
      structure({ paragraphs: [paragraph({ text: "Un párrafo sin ninguna cita." })] }),
    );
    expect(findings.some((f) => f.type === "Citas" && f.severity === "info")).toBe(true);
  });
});
