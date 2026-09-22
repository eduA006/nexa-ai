/**
 * Formateo determinista de referencias APA 7. No usa IA: el formato de
 * una referencia APA es una regla fija, no algo que deba "generar" un
 * modelo de lenguaje (riesgo de alucinar formato o datos incorrectos).
 * Funciones puras, sin dependencias de servidor — se pueden llamar
 * directamente desde un componente cliente.
 */

export type ReferenceOutput = { text: string; html: string };

/**
 * El HTML generado aquí se inyecta en el propio navegador del usuario
 * con `dangerouslySetInnerHTML` (para preservar cursivas al copiar/pegar
 * en Word). Aunque es contenido que el usuario solo ve en su propia
 * sesión (nunca se persiste ni se muestra a otros usuarios), se escapa
 * igual por buena práctica.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Solo permite esquemas http/https en un `href`. El texto de la URL ya
 * se escapa con `escapeHtml`, pero eso no valida el *esquema* — un valor
 * como "javascript:alert(1)" pasaría intacto dentro de un href real.
 * Cualquier otro esquema se neutraliza a "#".
 */
function safeHref(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    // URL inválida: cae al valor neutro de abajo.
  }
  return "#";
}

/**
 * Los autores se ingresan ya en formato "Apellido, A. A." separados por
 * punto y coma (ej. "García, J. M.; Pérez, L."). Aplica las reglas de
 * unión de APA 7: "&" antes del último si hay 2+, y elipsis si hay más
 * de 20 (se listan los primeros 19, "...", y el último).
 */
export function formatAuthorList(authorsRaw: string): string {
  const authors = authorsRaw
    .split(";")
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

  if (authors.length === 0) return "";
  if (authors.length === 1) return authors[0];
  if (authors.length <= 20) {
    return `${authors.slice(0, -1).join(", ")}, & ${authors[authors.length - 1]}`;
  }

  const first19 = authors.slice(0, 19).join(", ");
  const last = authors[authors.length - 1];
  return `${first19}, ... ${last}`;
}

/**
 * Los nombres de autor suelen terminar ya en "." (la inicial, ej.
 * "Ray, O."). Agregar otro punto de cierre sin verificar produce
 * "Ray, O.." — esta función evita el punto duplicado.
 */
function withPeriod(str: string): string {
  return /[.!?]$/.test(str) ? str : `${str}.`;
}

/** Apellido del primer autor, para la cita en texto (ej. "García" de "García, J. M."). */
function firstAuthorSurname(authorsRaw: string): string {
  const first = authorsRaw.split(";")[0]?.trim() ?? "";
  return first.split(",")[0]?.trim() ?? "";
}

export function buildInTextCitation(authorsRaw: string, year: string): string {
  const authorCount = authorsRaw.split(";").map((a) => a.trim()).filter(Boolean).length;
  const yearPart = year.trim() || "s.f.";

  if (authorCount === 0) return `(s.a., ${yearPart})`;
  if (authorCount === 1) return `(${firstAuthorSurname(authorsRaw)}, ${yearPart})`;
  return `(${firstAuthorSurname(authorsRaw)} et al., ${yearPart})`;
}

export type WebpageFields = {
  authors: string;
  year: string;
  date?: string;
  title: string;
  siteName?: string;
  url: string;
};

export function formatWebpageReference(fields: WebpageFields): ReferenceOutput {
  const authors = formatAuthorList(fields.authors);
  const yearPart = fields.date?.trim() || fields.year.trim() || "s.f.";
  const title = fields.title.trim();
  const site = fields.siteName?.trim();
  const url = fields.url.trim();

  const authorPrefix = authors ? `${withPeriod(authors)} ` : "";
  const sitePart = site && site !== authors ? ` ${site}.` : "";
  const titleWithPeriod = withPeriod(title);

  return {
    text: `${authorPrefix}(${yearPart}). ${titleWithPeriod}${sitePart} ${url}`.replace(/\s+/g, " ").trim(),
    html: `${escapeHtml(authorPrefix)}(${escapeHtml(yearPart)}). ${escapeHtml(titleWithPeriod)}${escapeHtml(sitePart)} <a href="${escapeHtml(safeHref(url))}">${escapeHtml(url)}</a>`
      .replace(/\s+/g, " ")
      .trim(),
  };
}

export type BookFields = {
  authors: string;
  year: string;
  title: string;
  edition?: string;
  publisher: string;
};

export function formatBookReference(fields: BookFields): ReferenceOutput {
  const authors = formatAuthorList(fields.authors);
  const year = fields.year.trim() || "s.f.";
  const title = fields.title.trim();
  const edition = fields.edition?.trim();
  const publisher = fields.publisher.trim();
  const editionPart = edition ? ` (${edition})` : "";
  const titleAndEdition = `${title}${editionPart}`;
  const closingPeriod = /[.!?]$/.test(titleAndEdition) ? "" : ".";

  return {
    text: `${withPeriod(authors)} (${year}). ${titleAndEdition}${closingPeriod} ${publisher}.`
      .replace(/\s+/g, " ")
      .trim(),
    html: `${escapeHtml(withPeriod(authors))} (${escapeHtml(year)}). <em>${escapeHtml(title)}${escapeHtml(editionPart)}</em>${closingPeriod} ${escapeHtml(publisher)}.`
      .replace(/\s+/g, " ")
      .trim(),
  };
}

export type ArticleFields = {
  authors: string;
  year: string;
  title: string;
  journal: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
};

export function formatArticleReference(fields: ArticleFields): ReferenceOutput {
  const authors = formatAuthorList(fields.authors);
  const year = fields.year.trim() || "s.f.";
  const title = fields.title.trim();
  const journal = fields.journal.trim();
  const volume = fields.volume?.trim();
  const issue = fields.issue?.trim();
  const pages = fields.pages?.trim();
  const doi = fields.doi?.trim();

  const volIssue = volume ? `, ${volume}${issue ? `(${issue})` : ""}` : "";
  const pagesPart = pages ? `, ${pages}` : "";
  const doiPart = doi ? ` https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//, "")}` : "";
  const titleWithPeriod = withPeriod(title);

  return {
    text: `${withPeriod(authors)} (${year}). ${titleWithPeriod} ${journal}${volIssue}${pagesPart}.${doiPart}`
      .replace(/\s+/g, " ")
      .trim(),
    html: `${escapeHtml(withPeriod(authors))} (${escapeHtml(year)}). ${escapeHtml(titleWithPeriod)} <em>${escapeHtml(journal)}${escapeHtml(volIssue)}</em>${escapeHtml(pagesPart)}.${doiPart ? ` <a href="https://doi.org/${escapeHtml(doi ?? "")}">${escapeHtml(doiPart.trim())}</a>` : ""}`
      .replace(/\s+/g, " ")
      .trim(),
  };
}

export type ThesisFields = {
  authors: string;
  year: string;
  title: string;
  thesisType: string;
  institution: string;
  repositoryUrl?: string;
};

export function formatThesisReference(fields: ThesisFields): ReferenceOutput {
  const authors = formatAuthorList(fields.authors);
  const year = fields.year.trim() || "s.f.";
  const title = fields.title.trim();
  const bracket = `[${fields.thesisType.trim()}, ${fields.institution.trim()}]`;
  const url = fields.repositoryUrl?.trim();

  return {
    text: `${withPeriod(authors)} (${year}). ${title} ${bracket}.${url ? ` ${url}` : ""}`
      .replace(/\s+/g, " ")
      .trim(),
    html: `${escapeHtml(withPeriod(authors))} (${escapeHtml(year)}). <em>${escapeHtml(title)}</em> ${escapeHtml(bracket)}.${url ? ` <a href="${escapeHtml(safeHref(url))}">${escapeHtml(url)}</a>` : ""}`
      .replace(/\s+/g, " ")
      .trim(),
  };
}
