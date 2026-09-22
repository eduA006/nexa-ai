import { describe, it, expect } from "vitest";
import {
  checkContactInfo,
  checkCommonSections,
  checkLength,
  checkQuantifiedAchievements,
  checkDateFormatConsistency,
} from "@/lib/rules/cv";

describe("checkContactInfo", () => {
  it("reporta error si falta el correo y warning si falta el teléfono", () => {
    const findings = checkContactInfo("Juan Pérez. Experiencia en ventas.");
    expect(findings).toHaveLength(2);
    expect(findings.find((f) => f.severity === "error")?.description).toMatch(/correo/);
    expect(findings.find((f) => f.severity === "warning")?.description).toMatch(/teléfono/);
  });

  it("no reporta nada con correo y teléfono presentes", () => {
    const findings = checkContactInfo("Contacto: juan@example.com, +51 987 654 321");
    expect(findings).toHaveLength(0);
  });
});

describe("checkCommonSections", () => {
  it("detecta secciones faltantes", () => {
    const findings = checkCommonSections("Solo un texto sin secciones claras.");
    expect(findings).toHaveLength(1);
    expect(findings[0].description).toContain("Experiencia");
    expect(findings[0].description).toContain("Educación");
    expect(findings[0].description).toContain("Habilidades");
  });

  it("no reporta nada cuando las tres secciones están presentes", () => {
    const findings = checkCommonSections("Experiencia laboral\nEducación\nHabilidades");
    expect(findings).toHaveLength(0);
  });
});

describe("checkLength", () => {
  it("reporta muy breve por debajo del mínimo", () => {
    const findings = checkLength("Un CV muy corto.");
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("warning");
  });

  it("reporta demasiado largo por encima del máximo", () => {
    const longText = Array.from({ length: 1300 }, () => "palabra").join(" ");
    const findings = checkLength(longText);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("info");
  });

  it("no reporta nada dentro del rango razonable", () => {
    const midText = Array.from({ length: 300 }, () => "palabra").join(" ");
    expect(checkLength(midText)).toHaveLength(0);
  });
});

describe("checkQuantifiedAchievements", () => {
  it("reporta pocos logros cuantificados en un CV largo sin números", () => {
    const text = Array.from({ length: 200 }, () => "palabra").join(" ");
    const findings = checkQuantifiedAchievements(text);
    expect(findings).toHaveLength(1);
  });

  it("no reporta nada con suficientes cifras", () => {
    const words = Array.from({ length: 200 }, (_, i) => (i % 5 === 0 ? "20%" : "palabra"));
    const findings = checkQuantifiedAchievements(words.join(" "));
    expect(findings).toHaveLength(0);
  });
});

describe("checkDateFormatConsistency", () => {
  it("detecta formatos de fecha mixtos", () => {
    const findings = checkDateFormatConsistency("Trabajé de 03/2019 a marzo 2021.");
    expect(findings).toHaveLength(1);
  });

  it("no reporta nada con un único formato consistente", () => {
    const findings = checkDateFormatConsistency("Trabajé de enero 2019 a marzo 2021.");
    expect(findings).toHaveLength(0);
  });
});
