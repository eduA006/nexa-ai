import { describe, it, expect } from "vitest";
import {
  formatAuthorList,
  buildInTextCitation,
  formatWebpageReference,
  formatBookReference,
  formatArticleReference,
  formatThesisReference,
} from "@/lib/citations/apa-reference";

describe("formatAuthorList", () => {
  it("un solo autor", () => {
    expect(formatAuthorList("Ray, O.")).toBe("Ray, O.");
  });

  it("dos autores usa &", () => {
    expect(formatAuthorList("García, J.; Pérez, L.")).toBe("García, J., & Pérez, L.");
  });

  it("más de 20 autores usa elipsis", () => {
    const authors = Array.from({ length: 25 }, (_, i) => `Autor${i}, A.`).join("; ");
    const result = formatAuthorList(authors);
    expect(result).toContain("...");
    expect(result).toContain("Autor0, A.");
    expect(result).toContain("Autor24, A.");
    expect(result).not.toContain("Autor19, A.");
  });

  it("ignora entradas vacías", () => {
    expect(formatAuthorList("")).toBe("");
  });
});

describe("buildInTextCitation", () => {
  it("un autor", () => {
    expect(buildInTextCitation("García, J.", "2020")).toBe("(García, 2020)");
  });

  it("dos o más autores usa et al.", () => {
    expect(buildInTextCitation("García, J.; Pérez, L.", "2020")).toBe("(García et al., 2020)");
  });

  it("sin año usa s.f.", () => {
    expect(buildInTextCitation("García, J.", "")).toBe("(García, s.f.)");
  });
});

describe("formatWebpageReference", () => {
  it("no duplica el punto cuando el título ya termina en punto", () => {
    const { text } = formatWebpageReference({
      authors: "Ray, O.",
      year: "2020",
      title: "Un título.",
      url: "https://example.com",
    });
    expect(text).not.toContain("título..");
  });

  it("neutraliza un esquema javascript: en el href pero conserva el texto visible", () => {
    const { html } = formatWebpageReference({
      authors: "Ray, O.",
      year: "2020",
      title: "Título",
      url: "javascript:alert(1)",
    });
    expect(html).toContain('href="#"');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain("javascript:alert(1)"); // texto visible, escapado como texto
  });

  it("conserva una URL http válida en el href", () => {
    const { html } = formatWebpageReference({
      authors: "Ray, O.",
      year: "2020",
      title: "Título",
      url: "https://example.com/page",
    });
    expect(html).toContain('href="https://example.com/page"');
  });

  it("escapa HTML en el título", () => {
    const { html } = formatWebpageReference({
      authors: "Ray, O.",
      year: "2020",
      title: "<script>alert(1)</script>",
      url: "https://example.com",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("formatBookReference", () => {
  it("incluye edición entre paréntesis", () => {
    const { text } = formatBookReference({
      authors: "García, J.",
      year: "2019",
      title: "Un libro",
      edition: "3.a ed.",
      publisher: "Editorial X",
    });
    expect(text).toContain("(3.a ed.)");
  });
});

describe("formatArticleReference", () => {
  it("arma el link de DOI a partir del doi crudo o con prefijo https", () => {
    const { html } = formatArticleReference({
      authors: "García, J.",
      year: "2019",
      title: "Un artículo",
      journal: "Revista X",
      doi: "10.1037/0003-066X.59.1.29",
    });
    expect(html).toContain('href="https://doi.org/10.1037/0003-066X.59.1.29"');
  });
});

describe("formatThesisReference", () => {
  it("neutraliza un esquema no-http en repositoryUrl", () => {
    const { html } = formatThesisReference({
      authors: "García, J.",
      year: "2019",
      title: "Una tesis",
      thesisType: "Tesis de licenciatura",
      institution: "Universidad X",
      repositoryUrl: "javascript:alert(1)",
    });
    expect(html).toContain('href="#"');
  });
});
