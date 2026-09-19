import "server-only";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

export type DocxParagraph = {
  text: string;
  fontFamily: string | null;
  fontSizePt: number | null;
  lineSpacing: { line: number; rule: string } | null;
  firstLineIndentTwips: number | null;
  styleId: string | null;
};

export type DocxStructure = {
  margins: { topIn: number; bottomIn: number; leftIn: number; rightIn: number } | null;
  paragraphs: DocxParagraph[];
  hasPageNumberingField: boolean;
  defaultFontFamily: string | null;
  defaultFontSizePt: number | null;
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function twipsToInches(twips: number): number {
  return twips / 1440;
}

function halfPointsToPt(halfPoints: number): number {
  return halfPoints / 2;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(t: unknown): string {
  if (t === undefined || t === null) return "";
  if (typeof t === "string") return t;
  if (typeof t === "object" && "#text" in (t as Record<string, unknown>)) {
    return String((t as Record<string, unknown>)["#text"] ?? "");
  }
  return "";
}

/**
 * Extrae estructura relevante para APA 7 de un DOCX: márgenes, fuente,
 * tamaño, interlineado y sangría por párrafo. Basado en la especificación
 * OOXML (word/document.xml, word/styles.xml), verificado empíricamente
 * contra un DOCX generado con la librería `docx`.
 */
export async function parseDocxStructure(buffer: Buffer): Promise<DocxStructure> {
  const zip = await JSZip.loadAsync(buffer);

  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error("El archivo no contiene word/document.xml (¿es un DOCX válido?).");
  }
  const documentXml = await documentFile.async("string");
  const stylesFile = zip.file("word/styles.xml");
  const stylesXml = stylesFile ? await stylesFile.async("string") : null;

  const doc = parser.parse(documentXml);
  const styles = stylesXml ? parser.parse(stylesXml) : null;

  const rPrDefault = styles?.["w:styles"]?.["w:docDefaults"]?.["w:rPrDefault"]?.["w:rPr"];
  const defaultFontFamily: string | null = rPrDefault?.["w:rFonts"]?.["@_w:ascii"] ?? null;
  const defaultSzVal = rPrDefault?.["w:sz"]?.["@_w:val"];
  const defaultFontSizePt = defaultSzVal ? halfPointsToPt(Number(defaultSzVal)) : null;

  const body = doc["w:document"]?.["w:body"];
  const sectPr = body?.["w:sectPr"];
  const pgMar = sectPr?.["w:pgMar"];
  const margins = pgMar
    ? {
        topIn: twipsToInches(Number(pgMar["@_w:top"])),
        bottomIn: twipsToInches(Number(pgMar["@_w:bottom"])),
        leftIn: twipsToInches(Number(pgMar["@_w:left"])),
        rightIn: twipsToInches(Number(pgMar["@_w:right"])),
      }
    : null;

  // Heurística: numeración de página activa si algún header contiene el
  // campo de campo PAGE (simple o complejo). No detecta numeración
  // insertada por métodos no estándar.
  let hasPageNumberingField = false;
  const headerFiles = Object.keys(zip.files).filter((name) =>
    /^word\/header\d*\.xml$/.test(name),
  );
  for (const name of headerFiles) {
    const content = await zip.file(name)?.async("string");
    if (content && (content.includes('w:instr=" PAGE ') || content.includes(">PAGE<"))) {
      hasPageNumberingField = true;
      break;
    }
  }

  const paragraphElements = asArray(body?.["w:p"]);
  const paragraphs: DocxParagraph[] = paragraphElements.map((p) => {
    const pPr = p?.["w:pPr"];
    const styleId: string | null = pPr?.["w:pStyle"]?.["@_w:val"] ?? null;
    const spacing = pPr?.["w:spacing"];
    const lineSpacing = spacing?.["@_w:line"]
      ? { line: Number(spacing["@_w:line"]), rule: String(spacing["@_w:lineRule"] ?? "auto") }
      : null;
    const ind = pPr?.["w:ind"];
    const firstLineIndentTwips = ind?.["@_w:firstLine"] ? Number(ind["@_w:firstLine"]) : null;

    const runs = asArray(p?.["w:r"]);
    const text = runs.map((r) => textOf(r?.["w:t"])).join("");

    const firstRunRPr = runs[0]?.["w:rPr"];
    const fontFamily: string | null = firstRunRPr?.["w:rFonts"]?.["@_w:ascii"] ?? null;
    const szVal = firstRunRPr?.["w:sz"]?.["@_w:val"];
    const fontSizePt = szVal ? halfPointsToPt(Number(szVal)) : null;

    return { text, fontFamily, fontSizePt, lineSpacing, firstLineIndentTwips, styleId };
  });

  return { margins, paragraphs, hasPageNumberingField, defaultFontFamily, defaultFontSizePt };
}
