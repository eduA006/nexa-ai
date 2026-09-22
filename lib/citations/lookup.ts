import "server-only";

export type DoiLookupResult = {
  authors: string;
  year: string;
  title: string;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
};

/**
 * Crossref (api.crossref.org) es una API pública y gratuita de metadatos
 * bibliográficos, sin autenticación. No se usa IA aquí: son los metadatos
 * reales registrados por el editor para ese DOI, no algo que deba
 * "adivinar" un modelo de lenguaje.
 */
export async function lookupDoi(doi: string): Promise<DoiLookupResult> {
  const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//, "");
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`, {
    headers: { "User-Agent": "NexaAI/1.0 (mailto:soporte@nexa-ai.example)" },
  });

  if (!response.ok) {
    throw new Error(`Crossref respondió con estado ${response.status}.`);
  }

  const data = await response.json();
  const message = data?.message;
  if (!message) throw new Error("Respuesta de Crossref sin datos.");

  const authors = Array.isArray(message.author)
    ? message.author
        .map((a: { family?: string; given?: string }) => {
          if (!a.family) return null;
          const initials = a.given
            ? a.given
                .split(/\s+/)
                .map((n: string) => `${n.charAt(0).toUpperCase()}.`)
                .join(" ")
            : "";
          return initials ? `${a.family}, ${initials}` : a.family;
        })
        .filter((a: string | null): a is string => a !== null)
        .join("; ")
    : "";

  const year =
    message["published-print"]?.["date-parts"]?.[0]?.[0] ??
    message["published-online"]?.["date-parts"]?.[0]?.[0] ??
    message.published?.["date-parts"]?.[0]?.[0] ??
    "";

  return {
    authors,
    year: year ? String(year) : "",
    title: Array.isArray(message.title) ? (message.title[0] ?? "") : "",
    journal: Array.isArray(message["container-title"]) ? (message["container-title"][0] ?? "") : "",
    volume: message.volume ?? "",
    issue: message.issue ?? "",
    pages: message.page ?? "",
    doi: cleanDoi,
  };
}

export type UrlLookupResult = {
  title: string;
  siteName: string;
};

/**
 * Best-effort: extrae <title> y og:site_name de la página. No todos los
 * sitios exponen estos metadatos de forma consistente, ni todos
 * permiten ser accedidos por un fetch de servidor (bloqueos anti-bot);
 * cuando falla, el usuario completa los campos manualmente.
 */
export async function lookupUrl(url: string): Promise<UrlLookupResult> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NexaAI/1.0)" },
  });

  if (!response.ok) {
    throw new Error(`El sitio respondió con estado ${response.status}.`);
  }

  const html = await response.text();

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const siteNameMatch = html.match(
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i,
  );

  return {
    title: titleMatch?.[1]?.trim() ?? "",
    siteName: siteNameMatch?.[1]?.trim() ?? "",
  };
}
