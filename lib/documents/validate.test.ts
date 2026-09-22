import { describe, it, expect } from "vitest";
import { validateFile } from "@/lib/documents/validate";

function makeFile(name: string, bytes: number[], sizeOverride?: number): File {
  const buffer = new Uint8Array(bytes);
  const file = new File([buffer], name);
  if (sizeOverride !== undefined) {
    Object.defineProperty(file, "size", { value: sizeOverride });
  }
  return file;
}

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]; // %PDF-1.4
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0];

describe("validateFile", () => {
  it("rechaza extensiones no soportadas", async () => {
    const file = makeFile("malware.exe", [0, 1, 2, 3]);
    const result = await validateFile(file, 10);
    expect(result.ok).toBe(false);
  });

  it("rechaza archivos que superan el tamaño máximo", async () => {
    const file = makeFile("doc.pdf", PDF_SIGNATURE, 20 * 1024 * 1024);
    const result = await validateFile(file, 10);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/límite/);
  });

  it("acepta un PDF con firma de bytes válida", async () => {
    const file = makeFile("informe.pdf", PDF_SIGNATURE);
    const result = await validateFile(file, 10);
    expect(result).toEqual({ ok: true, type: "pdf" });
  });

  it("rechaza un archivo .pdf cuyo contenido no es realmente un PDF", async () => {
    const file = makeFile("falso.pdf", [0x00, 0x01, 0x02, 0x03]);
    const result = await validateFile(file, 10);
    expect(result.ok).toBe(false);
  });

  it("acepta un DOCX (ZIP con extensión .docx)", async () => {
    const file = makeFile("tesis.docx", ZIP_SIGNATURE);
    const result = await validateFile(file, 10);
    expect(result).toEqual({ ok: true, type: "docx" });
  });

  it("acepta un XLSX (ZIP con extensión .xlsx)", async () => {
    const file = makeFile("datos.xlsx", ZIP_SIGNATURE);
    const result = await validateFile(file, 10);
    expect(result).toEqual({ ok: true, type: "xlsx" });
  });

  it("rechaza un ZIP cuya extensión no es docx ni xlsx", async () => {
    const file = makeFile("archivo.zip", ZIP_SIGNATURE);
    const result = await validateFile(file, 10);
    expect(result.ok).toBe(false);
  });

  it("acepta un CSV de texto plano", async () => {
    const bytes = Array.from(Buffer.from("nombre,edad\nAna,20\n", "utf-8"));
    const file = makeFile("datos.csv", bytes);
    const result = await validateFile(file, 10);
    expect(result).toEqual({ ok: true, type: "csv" });
  });

  it("rechaza un .csv cuyo contenido parece binario", async () => {
    const file = makeFile("falso.csv", [0x00, 0x01, 0x02, 0x03, 0x04]);
    const result = await validateFile(file, 10);
    expect(result.ok).toBe(false);
  });
});
