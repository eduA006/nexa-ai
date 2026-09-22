import "server-only";
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

const FETCH_TIMEOUT_MS = 5000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB, de sobra para <head>

/**
 * Bloquea rangos privados/loopback/link-local (incluye el endpoint de
 * metadata de nube 169.254.169.254) para evitar que un usuario use esta
 * herramienta para hacer que el servidor consulte recursos internos.
 */
export function isPrivateOrLoopbackIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // privado
    if (a === 172 && b >= 16 && b <= 31) return true; // privado
    if (a === 192 && b === 168) return true; // privado
    if (a === 169 && b === 254) return true; // link-local / metadata cloud
    if (a === 0) return true;
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true; // loopback
    if (normalized.startsWith("fe80:")) return true; // link-local
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA privada
    return false;
  }
  return true; // no se pudo parsear como IP: por seguridad, se rechaza
}

/**
 * Valida que una URL provista por el usuario sea segura para que el
 * servidor la consulte: solo http/https, y el hostname no debe resolver
 * a una IP privada/loopback/link-local (protege también contra DNS
 * rebinding, ya que se resuelve y valida la IP real, no solo el string).
 */
export async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL inválida.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Solo se admiten URLs http o https.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("No se permite consultar direcciones locales.");
  }

  if (isIP(hostname)) {
    if (isPrivateOrLoopbackIp(hostname)) {
      throw new Error("No se permite consultar direcciones privadas.");
    }
    return parsed;
  }

  const resolved = await dnsLookup(hostname, { all: true });
  if (resolved.length === 0 || resolved.some((r) => isPrivateOrLoopbackIp(r.address))) {
    throw new Error("No se permite consultar esa dirección.");
  }

  return parsed;
}

async function fetchWithGuards(url: string, headers: Record<string, string>): Promise<string> {
  await assertSafeExternalUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal, redirect: "error" });
    if (!response.ok) {
      throw new Error(`El sitio respondió con estado ${response.status}.`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      throw new Error("La respuesta del sitio es demasiado grande.");
    }

    const reader = response.body?.getReader();
    if (!reader) return await response.text();

    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("La respuesta del sitio es demasiado grande.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
  } finally {
    clearTimeout(timeout);
  }
}

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
  const html = await fetchWithGuards(url, {
    "User-Agent": "Mozilla/5.0 (compatible; NexaAI/1.0)",
  });

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const siteNameMatch = html.match(
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i,
  );

  return {
    title: titleMatch?.[1]?.trim() ?? "",
    siteName: siteNameMatch?.[1]?.trim() ?? "",
  };
}
