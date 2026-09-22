"use server";

import { lookupDoi, lookupUrl, type DoiLookupResult, type UrlLookupResult } from "@/lib/citations/lookup";

export type DoiLookupState = { data: DoiLookupResult } | { error: string } | undefined;

export async function lookupDoiAction(
  _prevState: DoiLookupState,
  formData: FormData,
): Promise<DoiLookupState> {
  const doi = formData.get("doi");
  if (typeof doi !== "string" || doi.trim().length === 0) {
    return { error: "Ingresa un DOI." };
  }

  try {
    const data = await lookupDoi(doi);
    if (!data.title) return { error: "No se encontraron datos para ese DOI." };
    return { data };
  } catch (error) {
    console.error("[ReferenciasApa] Error en búsqueda de DOI:", error);
    return { error: "No se pudo obtener información de ese DOI. Completa los campos manualmente." };
  }
}

export type UrlLookupState = { data: UrlLookupResult } | { error: string } | undefined;

export async function lookupUrlAction(
  _prevState: UrlLookupState,
  formData: FormData,
): Promise<UrlLookupState> {
  const url = formData.get("url");
  if (typeof url !== "string" || url.trim().length === 0) {
    return { error: "Ingresa una URL." };
  }

  try {
    const data = await lookupUrl(url);
    if (!data.title) return { error: "No se pudo extraer información de esa URL." };
    return { data };
  } catch (error) {
    console.error("[ReferenciasApa] Error en búsqueda de URL:", error);
    return { error: "No se pudo acceder a esa URL. Completa los campos manualmente." };
  }
}
