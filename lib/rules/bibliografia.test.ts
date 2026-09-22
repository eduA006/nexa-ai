import { describe, it, expect } from "vitest";
import { runBibliografiaRules, extractInTextCitations } from "@/lib/rules/bibliografia";

describe("extractInTextCitations", () => {
  it("extrae citas parentéticas simples", () => {
    const citations = extractInTextCitations("El estudio mostró resultados (García, 2020).");
    expect(citations).toHaveLength(1);
    expect(citations[0].year).toBe("2020");
    expect(citations[0].authorTokens).toContain("García");
  });

  it("extrae múltiples citas separadas por punto y coma dentro del mismo paréntesis", () => {
    const citations = extractInTextCitations("Varios autores coinciden (García, 2020; Pérez, 2019).");
    expect(citations).toHaveLength(2);
  });

  it("extrae citas narrativas Autor (Año)", () => {
    const citations = extractInTextCitations("García (2020) encontró que...");
    expect(citations).toHaveLength(1);
    expect(citations[0].year).toBe("2020");
  });
});

describe("runBibliografiaRules", () => {
  it("reporta error si no hay sección de Referencias", () => {
    const result = runBibliografiaRules("Solo un párrafo sin sección de referencias.");
    expect(result.score).toBe(0);
    expect(result.findings.some((f) => f.type === "Sección de referencias")).toBe(true);
  });

  it("detecta una cita sin referencia correspondiente", () => {
    const text = [
      "En el cuerpo se cita a (García, 2020) y también a (Pérez, 2019).",
      "",
      "Referencias",
      "García, J. (2020). Un artículo sobre algo. Revista X.",
    ].join("\n");

    const result = runBibliografiaRules(text);
    const orphanCitation = result.findings.find(
      (f) => f.type === "Cita sin referencia" && f.location.includes("Pérez"),
    );
    expect(orphanCitation).toBeDefined();
    expect(orphanCitation?.severity).toBe("error");
  });

  it("detecta una referencia no citada", () => {
    const text = [
      "En el cuerpo se cita a (García, 2020).",
      "",
      "Referencias",
      "García, J. (2020). Un artículo. Revista X.",
      "Pérez, L. (2019). Un libro nunca citado. Editorial Y.",
    ].join("\n");

    const result = runBibliografiaRules(text);
    const uncited = result.findings.find((f) => f.type === "Referencia no citada");
    expect(uncited).toBeDefined();
    expect(uncited?.location).toContain("Pérez");
    expect(uncited?.severity).toBe("warning");
  });

  it("no reporta desajustes cuando todo coincide", () => {
    const text = [
      "García (2020) planteó una idea central.",
      "",
      "Referencias",
      "García, J. (2020). Un artículo. Revista X.",
    ].join("\n");

    const result = runBibliografiaRules(text);
    expect(result.findings.some((f) => f.type === "Cita sin referencia")).toBe(false);
    expect(result.findings.some((f) => f.type === "Referencia no citada")).toBe(false);
    expect(result.score).toBe(100);
  });
});
