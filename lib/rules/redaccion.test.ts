import { describe, it, expect } from "vitest";
import {
  checkDoubleSpaces,
  checkRepeatedWords,
  checkMissingSpaceAfterPunctuation,
  checkLongSentences,
  runRedaccionRules,
} from "@/lib/rules/redaccion";

describe("checkDoubleSpaces", () => {
  it("detecta espacios dobles", () => {
    expect(checkDoubleSpaces("Hola  mundo")).toHaveLength(1);
  });

  it("no reporta nada con espaciado normal", () => {
    expect(checkDoubleSpaces("Hola mundo")).toHaveLength(0);
  });
});

describe("checkRepeatedWords", () => {
  it("detecta una palabra repetida consecutiva", () => {
    const findings = checkRepeatedWords("El el gato duerme.");
    expect(findings).toHaveLength(1);
    expect(findings[0].description).toContain("el");
  });

  it("no confunde palabras distintas", () => {
    expect(checkRepeatedWords("El gato el perro.")).toHaveLength(0);
  });
});

describe("checkMissingSpaceAfterPunctuation", () => {
  it("detecta puntuación pegada al texto siguiente", () => {
    expect(checkMissingSpaceAfterPunctuation("Hola,mundo.Adiós")).toHaveLength(1);
  });

  it("no reporta nada con puntuación bien espaciada", () => {
    expect(checkMissingSpaceAfterPunctuation("Hola, mundo. Adiós")).toHaveLength(0);
  });
});

describe("checkLongSentences", () => {
  it("detecta una oración de más de 40 palabras", () => {
    const longSentence = Array.from({ length: 41 }, () => "palabra").join(" ") + ".";
    const findings = checkLongSentences(longSentence);
    expect(findings).toHaveLength(1);
    expect(findings[0].affectedParagraphs).toEqual([1]);
  });

  it("no reporta oraciones cortas", () => {
    expect(checkLongSentences("Una oración corta.")).toHaveLength(0);
  });
});

describe("runRedaccionRules", () => {
  it("combina hallazgos de todas las reglas", () => {
    const text = "Hola  mundo. El el gato,corre.";
    const findings = runRedaccionRules(text);
    const types = findings.map((f) => f.type);
    expect(types).toContain("Espacios dobles");
    expect(types).toContain("Palabras repetidas");
    expect(types).toContain("Puntuación pegada al texto");
  });

  it("no reporta nada sobre texto limpio y corto", () => {
    expect(runRedaccionRules("Un texto limpio y corto.")).toHaveLength(0);
  });
});
