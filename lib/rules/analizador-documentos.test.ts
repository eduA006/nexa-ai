import { describe, it, expect } from "vitest";
import { extractDocumentFacts } from "@/lib/rules/analizador-documentos";

describe("extractDocumentFacts", () => {
  it("extrae fechas en formato dd/mm/aaaa y en formato textual", () => {
    const text = "El contrato inicia el 01/04/2024 y se firmó el 15 de marzo de 2024.";
    const { dates } = extractDocumentFacts(text);
    expect(dates).toContain("01/04/2024");
    expect(dates.some((d) => d.toLowerCase().includes("15 de marzo de 2024"))).toBe(true);
  });

  it("extrae montos con símbolo de moneda y porcentajes", () => {
    const text = "El pago mensual es de $8,500 más un recargo del 10%.";
    const { amounts } = extractDocumentFacts(text);
    expect(amounts).toContain("$8,500");
    expect(amounts).toContain("10%");
  });

  it("no duplica coincidencias repetidas", () => {
    const text = "El monto es $100. Otra vez, $100.";
    const { amounts } = extractDocumentFacts(text);
    expect(amounts.filter((a) => a === "$100")).toHaveLength(1);
  });

  it("devuelve arreglos vacíos cuando no hay coincidencias", () => {
    const { dates, amounts } = extractDocumentFacts("Un texto sin fechas ni montos.");
    expect(dates).toHaveLength(0);
    expect(amounts).toHaveLength(0);
  });
});
