import "server-only";
import JSZip from "jszip";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  suppressEmptyNode: true,
  // Por defecto (true) convierte atributos con valor string "true" en
  // atributos booleanos estilo HTML (ej. on="true" -> on), lo cual
  // corrompe markup VML legado que usan documentos reales de Word
  // (ej. <v:fill on="true" .../> para imágenes) al perder el valor.
  suppressBooleanAttributes: false,
});

const MARGIN_TWIPS = 1440; // 1 in
const LINE_VALUE = 480; // doble espacio
const INDENT_TWIPS = 720; // 0.5 in

/**
 * OOXML exige que los hijos de w:pPr y w:rPr respeten un orden fijo
 * (CT_PPrBase / CT_RPr en el schema). Insertar una propiedad nueva al
 * final del objeto, sin más, puede violar ese orden y producir un DOCX
 * que Word considera corrupto. `setOrderedChild` inserta respetando el
 * orden del schema en vez de simplemente hacer `obj[key] = value`.
 */
const PPR_ORDER = [
  "w:pStyle", "w:keepNext", "w:keepLines", "w:pageBreakBefore", "w:framePr",
  "w:widowControl", "w:numPr", "w:suppressLineNumbers", "w:pBdr", "w:shd",
  "w:tabs", "w:suppressAutoHyphens", "w:kinsoku", "w:wordWrap", "w:overflowPunct",
  "w:topLinePunct", "w:autoSpaceDE", "w:autoSpaceDN", "w:bidi", "w:adjustRightInd",
  "w:snapToGrid", "w:spacing", "w:ind", "w:contextualSpacing", "w:mirrorIndents",
  "w:suppressOverlap", "w:jc", "w:textDirection", "w:textAlignment",
  "w:textboxTightWrap", "w:outlineLvl", "w:divId", "w:cnfStyle", "w:rPr",
  "w:sectPr", "w:pPrChange",
];

const RPR_ORDER = [
  "w:ins", "w:del", "w:moveFrom", "w:moveTo", "w:rStyle", "w:rFonts", "w:b",
  "w:bCs", "w:i", "w:iCs", "w:caps", "w:smallCaps", "w:strike", "w:dstrike",
  "w:outline", "w:shadow", "w:emboss", "w:imprint", "w:noProof", "w:snapToGrid",
  "w:vanish", "w:webHidden", "w:color", "w:spacing", "w:w", "w:kern",
  "w:position", "w:sz", "w:szCs", "w:highlight", "w:u", "w:effect", "w:bdr",
  "w:shd", "w:fitText", "w:vertAlign", "w:rtl", "w:cs", "w:em", "w:lang",
  "w:eastAsianLayout", "w:specVanish", "w:oMath",
];

function setOrderedChild(
  parent: Record<string, unknown>,
  key: string,
  value: unknown,
  order: string[],
): void {
  if (key in parent) {
    parent[key] = value;
    return;
  }

  const insertIndex = order.indexOf(key);
  const entries = Object.entries(parent);
  let inserted = false;
  const rebuilt: [string, unknown][] = [];

  for (const [existingKey, existingValue] of entries) {
    if (!inserted) {
      const existingIndex = order.indexOf(existingKey);
      if (insertIndex === -1 || existingIndex === -1 || existingIndex > insertIndex) {
        rebuilt.push([key, value]);
        inserted = true;
      }
    }
    rebuilt.push([existingKey, existingValue]);
  }
  if (!inserted) rebuilt.push([key, value]);

  for (const existingKey of Object.keys(parent)) delete parent[existingKey];
  for (const [k, v] of rebuilt) parent[k] = v;
}

/**
 * Garantiza que `parent[key]` sea un objeto (contenedor) utilizable,
 * insertándolo como PRIMER hijo si no existe. Usado para w:pPr dentro
 * de w:p, w:rPr dentro de w:r y w:rPrDefault dentro de w:docDefaults,
 * que el schema exige como primer elemento cuando están presentes.
 *
 * Una etiqueta vacía autocontenida (ej. `<w:rPrDefault/>`) se parsea
 * como string vacío `""`, no como objeto — también se normaliza aquí,
 * reemplazándola en el mismo lugar (sin reordenar) para no perder la
 * posición que ya tenía en el XML original.
 */
function ensureObjectChild(
  parent: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const existing = parent[key];
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return existing as Record<string, unknown>;
  }

  if (key in parent) {
    parent[key] = {};
    return parent[key] as Record<string, unknown>;
  }

  const entries = Object.entries(parent);
  for (const existingKey of Object.keys(parent)) delete parent[existingKey];
  parent[key] = {};
  for (const [k, v] of entries) parent[k] = v;
  return parent[key] as Record<string, unknown>;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function isHeadingParagraph(styleId: string | undefined | null): boolean {
  if (!styleId) return false;
  return /^(Title|Heading\d?)$/i.test(styleId);
}

export type DocxCorrectionOptions = {
  font?: string;
  fontSizePt?: number;
};

/**
 * Aplica correcciones de formato APA 7 deterministas (márgenes,
 * interlineado, sangría, fuente y tamaño) directamente sobre el XML del
 * DOCX (parseo → mutación del árbol respetando el orden del schema →
 * reserialización), preservando el resto del archivo (imágenes,
 * encabezados, relaciones) sin tocar.
 *
 * No reescribe el contenido del texto, las citas, ni agrega numeración
 * de página o una sección de referencias — esas correcciones requieren
 * revisión humana y no son puramente de formato.
 */
export async function applyDocxFormatFixes(
  buffer: Buffer,
  options: DocxCorrectionOptions = {},
): Promise<Buffer> {
  const font = options.font ?? "Times New Roman";
  const halfPt = String((options.fontSizePt ?? 12) * 2);

  const zip = await JSZip.loadAsync(buffer);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error("El archivo no contiene word/document.xml (¿es un DOCX válido?).");
  }

  const documentXml = await documentFile.async("string");
  const doc = parser.parse(documentXml);
  const body = doc["w:document"]?.["w:body"];
  if (!body) {
    throw new Error("Estructura de documento inválida: no se encontró w:body.");
  }

  const pgMar = body["w:sectPr"]?.["w:pgMar"];
  if (pgMar) {
    pgMar["@_w:top"] = String(MARGIN_TWIPS);
    pgMar["@_w:bottom"] = String(MARGIN_TWIPS);
    pgMar["@_w:left"] = String(MARGIN_TWIPS);
    pgMar["@_w:right"] = String(MARGIN_TWIPS);
  }

  const fontProps = {
    "@_w:ascii": font,
    "@_w:hAnsi": font,
    "@_w:cs": font,
    "@_w:eastAsia": font,
  };

  for (const p of asArray(body["w:p"])) {
    const styleId: string | undefined = p["w:pPr"]?.["w:pStyle"]?.["@_w:val"];
    if (isHeadingParagraph(styleId)) continue;

    const pPr = ensureObjectChild(p, "w:pPr");
    setOrderedChild(
      pPr,
      "w:spacing",
      { "@_w:line": String(LINE_VALUE), "@_w:lineRule": "auto" },
      PPR_ORDER,
    );
    setOrderedChild(pPr, "w:ind", { "@_w:firstLine": String(INDENT_TWIPS) }, PPR_ORDER);

    for (const r of asArray(p["w:r"])) {
      const rPr = ensureObjectChild(r, "w:rPr");
      setOrderedChild(rPr, "w:rFonts", fontProps, RPR_ORDER);
      setOrderedChild(rPr, "w:sz", { "@_w:val": halfPt }, RPR_ORDER);
      setOrderedChild(rPr, "w:szCs", { "@_w:val": halfPt }, RPR_ORDER);
    }
  }

  zip.file("word/document.xml", builder.build(doc));

  const stylesFile = zip.file("word/styles.xml");
  if (stylesFile) {
    const stylesXml = await stylesFile.async("string");
    const stylesObj = parser.parse(stylesXml);
    const docDefaults = stylesObj["w:styles"]?.["w:docDefaults"];
    if (docDefaults) {
      const rPrDefaultContainer = ensureObjectChild(docDefaults, "w:rPrDefault");
      const rPrDefault = ensureObjectChild(rPrDefaultContainer, "w:rPr");
      setOrderedChild(rPrDefault, "w:rFonts", fontProps, RPR_ORDER);
      setOrderedChild(rPrDefault, "w:sz", { "@_w:val": halfPt }, RPR_ORDER);
      setOrderedChild(rPrDefault, "w:szCs", { "@_w:val": halfPt }, RPR_ORDER);
      zip.file("word/styles.xml", builder.build(stylesObj));
    }
  }

  return zip.generateAsync({ type: "nodebuffer" });
}
