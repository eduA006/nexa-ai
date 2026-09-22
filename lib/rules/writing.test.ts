import { describe, it, expect } from "vitest";
import {
  checkSentenceVariety,
  checkLexicalDiversity,
  checkRepeatedSentences,
  checkFillerPhrases,
} from "@/lib/rules/writing";

describe("checkSentenceVariety", () => {
  it("reporta uniformidad cuando todas las oraciones tienen casi la misma longitud", () => {
    const sentences = Array.from(
      { length: 10 },
      (_, i) => `Esta es una oración de prueba número ${i}.`,
    );
    const findings = checkSentenceVariety(sentences);
    expect(findings).toHaveLength(1);
  });

  it("no reporta nada con menos oraciones que el mínimo", () => {
    expect(checkSentenceVariety(["Una.", "Otra."])).toHaveLength(0);
  });

  it("no reporta nada con longitudes variadas", () => {
    const sentences = [
      "Corta.",
      "Esta es una oración considerablemente más larga que las demás para variar.",
      "Media longitud aquí.",
      "Otra vez muy corta.",
      "Una oración de longitud completamente distinta a las anteriores para variar el ritmo.",
      "Corta también.",
      "Y esta es otra oración larga que agrega bastante variación al conjunto de prueba.",
      "Fin.",
    ];
    expect(checkSentenceVariety(sentences)).toHaveLength(0);
  });
});

describe("checkLexicalDiversity", () => {
  it("reporta vocabulario repetitivo en un texto largo con pocas palabras distintas", () => {
    const text = Array.from({ length: 200 }, () => "palabra repetida siempre").join(" ");
    const findings = checkLexicalDiversity(text);
    expect(findings).toHaveLength(1);
  });

  it("no reporta nada en un texto corto (bajo el mínimo)", () => {
    expect(checkLexicalDiversity("Texto corto.")).toHaveLength(0);
  });
});

describe("checkRepeatedSentences", () => {
  it("detecta una oración larga repetida", () => {
    const sentence = "Esta oración específica se repite exactamente dos veces en el texto.";
    const findings = checkRepeatedSentences([sentence, "Otra distinta.", sentence]);
    expect(findings).toHaveLength(1);
  });

  it("ignora oraciones triviales cortas repetidas", () => {
    expect(checkRepeatedSentences(["Sí.", "Sí.", "Sí."])).toHaveLength(0);
  });
});

describe("checkFillerPhrases", () => {
  it("reporta cuando hay 3 o más muletillas", () => {
    const text = "Cabe destacar que en este sentido, por otro lado, es importante.";
    const findings = checkFillerPhrases(text);
    expect(findings).toHaveLength(1);
  });

  it("no reporta nada con menos de 3 muletillas", () => {
    expect(checkFillerPhrases("Cabe destacar que esto es relevante.")).toHaveLength(0);
  });
});
