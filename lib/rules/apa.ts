import type { DocxStructure } from "@/lib/documents/extract/docx";
import type { RuleFinding } from "@/lib/rules/types";

export type { RuleSeverity, RuleFinding } from "@/lib/rules/types";

const EXPECTED_MARGIN_IN = 1;
const MARGIN_TOLERANCE_IN = 0.03;
const EXPECTED_FIRST_LINE_INDENT_TWIPS = 720; // 0.5 in
const INDENT_TOLERANCE_TWIPS = 20;
const EXPECTED_LINE_VALUE = 480; // doble espacio, lineRule "auto"

const ACCEPTED_FONTS: Record<string, number[]> = {
  "Times New Roman": [12],
  Georgia: [11],
  Arial: [11],
  Calibri: [11],
  "Lucida Sans Unicode": [10],
};

function isHeadingParagraph(styleId: string | null): boolean {
  if (!styleId) return false;
  return /^(Title|Heading\d?)$/i.test(styleId);
}

export function checkMargins(structure: DocxStructure): RuleFinding[] {
  if (!structure.margins) {
    return [
      {
        type: "Márgenes",
        severity: "warning",
        location: "Documento completo",
        description: "No se pudo determinar la configuración de márgenes del documento.",
        recommendation: "Verifica manualmente que los márgenes sean de 1 pulgada en los cuatro lados.",
      },
    ];
  }

  const { topIn, bottomIn, leftIn, rightIn } = structure.margins;
  const offenders = [
    ["superior", topIn],
    ["inferior", bottomIn],
    ["izquierdo", leftIn],
    ["derecho", rightIn],
  ].filter(([, value]) => Math.abs((value as number) - EXPECTED_MARGIN_IN) > MARGIN_TOLERANCE_IN);

  if (offenders.length === 0) return [];

  return [
    {
      type: "Márgenes",
      severity: "error",
      location: "Documento completo",
      description: `El margen ${offenders.map(([side]) => side).join(", ")} no es de 1 pulgada (valores detectados: ${offenders
        .map(([side, value]) => `${side}: ${(value as number).toFixed(2)}"`)
        .join(", ")}).`,
      recommendation: "Ajusta los márgenes del documento a 1 pulgada (2.54 cm) en los cuatro lados.",
    },
  ];
}

export function checkFontConsistency(structure: DocxStructure): RuleFinding[] {
  const fonts = new Set<string>();
  const sizes = new Set<number>();

  for (const p of structure.paragraphs) {
    if (isHeadingParagraph(p.styleId) || p.text.trim().length === 0) continue;
    fonts.add(p.fontFamily ?? structure.defaultFontFamily ?? "(sin especificar)");
    if (p.fontSizePt) sizes.add(p.fontSizePt);
  }

  const findings: RuleFinding[] = [];

  if (fonts.size > 1) {
    findings.push({
      type: "Tipografía",
      severity: "warning",
      location: "Documento completo",
      description: `Se detectó más de una fuente en el cuerpo del texto: ${Array.from(fonts).join(", ")}.`,
      recommendation: "Usa una única fuente consistente en todo el documento (ej. Times New Roman 12pt).",
    });
  }

  if (sizes.size > 1) {
    findings.push({
      type: "Tamaño de fuente",
      severity: "warning",
      location: "Documento completo",
      description: `Se detectó más de un tamaño de fuente en el cuerpo del texto: ${Array.from(sizes).join(", ")}pt.`,
      recommendation: "Usa un tamaño de fuente consistente en todo el documento.",
    });
  }

  const [singleFont] = fonts.size === 1 ? Array.from(fonts) : [null];
  const [singleSize] = sizes.size === 1 ? Array.from(sizes) : [null];

  if (singleFont && singleFont !== "(sin especificar)") {
    const acceptedSizes = ACCEPTED_FONTS[singleFont];
    if (!acceptedSizes) {
      findings.push({
        type: "Tipografía",
        severity: "warning",
        location: "Documento completo",
        description: `La fuente "${singleFont}" no está entre las recomendadas explícitamente por APA 7.`,
        recommendation:
          "APA 7 recomienda Times New Roman 12pt, Calibri 11pt, Arial 11pt, Georgia 11pt o Lucida Sans Unicode 10pt.",
      });
    } else if (singleSize && !acceptedSizes.includes(singleSize)) {
      findings.push({
        type: "Tamaño de fuente",
        severity: "warning",
        location: "Documento completo",
        description: `Con la fuente "${singleFont}", APA 7 recomienda tamaño ${acceptedSizes.join(" o ")}pt; se detectó ${singleSize}pt.`,
        recommendation: `Ajusta el tamaño de fuente a ${acceptedSizes.join(" o ")}pt.`,
      });
    }
  }

  return findings;
}

export function checkLineSpacing(structure: DocxStructure): RuleFinding[] {
  const offending: number[] = [];
  structure.paragraphs.forEach((p, index) => {
    if (p.text.trim().length === 0 || isHeadingParagraph(p.styleId)) return;
    const line = p.lineSpacing;
    const isDouble = line && line.rule === "auto" && line.line === EXPECTED_LINE_VALUE;
    if (!isDouble) offending.push(index + 1);
  });

  if (offending.length === 0) return [];

  return [
    {
      type: "Interlineado",
      severity: "error",
      location: `${offending.length} párrafo${offending.length > 1 ? "s" : ""}`,
      description: `${offending.length} párrafo${offending.length > 1 ? "s no tienen" : " no tiene"} interlineado doble configurado.`,
      recommendation: "Configura interlineado doble (2.0) en todo el cuerpo del documento.",
      affectedParagraphs: offending,
    },
  ];
}

export function checkIndentation(structure: DocxStructure): RuleFinding[] {
  const offending: number[] = [];
  structure.paragraphs.forEach((p, index) => {
    if (p.text.trim().length === 0 || isHeadingParagraph(p.styleId)) return;
    const indent = p.firstLineIndentTwips;
    const hasCorrectIndent =
      indent !== null &&
      Math.abs(indent - EXPECTED_FIRST_LINE_INDENT_TWIPS) <= INDENT_TOLERANCE_TWIPS;
    if (!hasCorrectIndent) offending.push(index + 1);
  });

  if (offending.length === 0) return [];

  return [
    {
      type: "Sangría",
      severity: "warning",
      location: `${offending.length} párrafo${offending.length > 1 ? "s" : ""}`,
      description: `${offending.length} párrafo${offending.length > 1 ? "s no tienen" : " no tiene"} sangría de primera línea de 0.5 pulgadas.`,
      recommendation: "Aplica sangría de primera línea de 0.5 pulgadas (1.27 cm) a los párrafos de cuerpo.",
      affectedParagraphs: offending,
    },
  ];
}

export function checkPageNumbering(structure: DocxStructure): RuleFinding[] {
  if (structure.hasPageNumberingField) return [];
  return [
    {
      type: "Numeración",
      severity: "warning",
      location: "Documento completo",
      description: "No se detectó un campo de numeración de página en el encabezado.",
      recommendation: "Agrega numeración de página en la esquina superior derecha (Insertar > Número de página).",
    },
  ];
}

const CITATION_PATTERN = /\(([A-ZÁÉÍÓÚÑ][\wÀ-ÿ.&\s]+,\s*(?:\d{4}|s\.f\.)[a-z]?)\)/g;

export function checkReferencesSection(structure: DocxStructure): RuleFinding[] {
  const hasReferencesHeading = structure.paragraphs.some((p) =>
    /^(referencias|references)$/i.test(p.text.trim()),
  );

  const fullText = structure.paragraphs.map((p) => p.text).join(" ");
  const citationCount = (fullText.match(CITATION_PATTERN) ?? []).length;

  const findings: RuleFinding[] = [];

  if (citationCount > 0 && !hasReferencesHeading) {
    findings.push({
      type: "Referencias",
      severity: "error",
      location: "Documento completo",
      description: `Se detectaron ${citationCount} posibles citas en texto, pero no se encontró una sección "Referencias".`,
      recommendation: 'Agrega una sección "Referencias" al final del documento con el listado completo en formato APA 7.',
    });
  }

  if (citationCount === 0) {
    findings.push({
      type: "Citas",
      severity: "info",
      location: "Documento completo",
      description: "No se detectaron citas en el formato APA (Autor, Año) dentro del texto.",
      recommendation: "Si el trabajo requiere citas, verifica que sigan el formato (Apellido, Año).",
    });
  }

  return findings;
}

/** Ejecuta todas las reglas programadas de APA 7 sobre la estructura del DOCX. */
export function runApaRules(structure: DocxStructure): RuleFinding[] {
  return [
    ...checkMargins(structure),
    ...checkFontConsistency(structure),
    ...checkLineSpacing(structure),
    ...checkIndentation(structure),
    ...checkPageNumbering(structure),
    ...checkReferencesSection(structure),
  ];
}
