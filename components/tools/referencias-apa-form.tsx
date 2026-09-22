"use client";

import { useActionState, useMemo, useState } from "react";
import { Copy, Check, Loader2, Search } from "lucide-react";
import {
  lookupDoiAction,
  lookupUrlAction,
  type DoiLookupState,
  type UrlLookupState,
} from "@/lib/tools/referencias-apa/actions";
import {
  buildInTextCitation,
  formatArticleReference,
  formatBookReference,
  formatThesisReference,
  formatWebpageReference,
  type ReferenceOutput,
} from "@/lib/citations/apa-reference";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SourceType = "webpage" | "book" | "article" | "thesis";

const SOURCE_LABELS: Record<SourceType, string> = {
  webpage: "Página web",
  book: "Libro",
  article: "Artículo de revista",
  thesis: "Tesis",
};

type Fields = {
  authors: string;
  year: string;
  title: string;
  siteName: string;
  url: string;
  edition: string;
  publisher: string;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  thesisType: string;
  institution: string;
};

const EMPTY_FIELDS: Fields = {
  authors: "",
  year: "",
  title: "",
  siteName: "",
  url: "",
  edition: "",
  publisher: "",
  journal: "",
  volume: "",
  issue: "",
  pages: "",
  doi: "",
  thesisType: "Tesis de licenciatura",
  institution: "",
};

async function copyReference(reference: ReferenceOutput) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([reference.text], { type: "text/plain" }),
        "text/html": new Blob([reference.html], { type: "text/html" }),
      }),
    ]);
  } catch {
    await navigator.clipboard.writeText(reference.text);
  }
}

export function ReferenciasApaForm() {
  const [sourceType, setSourceType] = useState<SourceType>("article");
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [copied, setCopied] = useState(false);

  const [doiState, doiAction, doiPending] = useActionState<DoiLookupState, FormData>(
    lookupDoiAction,
    undefined,
  );
  const [urlState, urlAction, urlPending] = useActionState<UrlLookupState, FormData>(
    lookupUrlAction,
    undefined,
  );

  // Aplica los resultados de búsqueda (DOI/URL) a los campos cuando la
  // referencia de estado cambia. Se hace durante el render (no en un
  // efecto) siguiendo el patrón oficial de React para "ajustar estado
  // cuando cambia una prop/valor externo" — evita el round-trip extra
  // de un efecto y el warning de setState-en-efecto.
  const [lastDoiState, setLastDoiState] = useState(doiState);
  if (doiState !== lastDoiState) {
    setLastDoiState(doiState);
    if (doiState && "data" in doiState) {
      const d = doiState.data;
      setFields((f) => ({
        ...f,
        authors: d.authors || f.authors,
        year: d.year || f.year,
        title: d.title || f.title,
        journal: d.journal || f.journal,
        volume: d.volume || f.volume,
        issue: d.issue || f.issue,
        pages: d.pages || f.pages,
        doi: d.doi || f.doi,
      }));
    }
  }

  const [lastUrlState, setLastUrlState] = useState(urlState);
  if (urlState !== lastUrlState) {
    setLastUrlState(urlState);
    if (urlState && "data" in urlState) {
      const d = urlState.data;
      setFields((f) => ({
        ...f,
        title: d.title || f.title,
        siteName: d.siteName || f.siteName,
      }));
    }
  }

  function update<K extends keyof Fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  const reference = useMemo<ReferenceOutput | null>(() => {
    if (sourceType === "webpage") {
      if (!fields.title || !fields.url) return null;
      return formatWebpageReference(fields);
    }
    if (sourceType === "book") {
      if (!fields.authors || !fields.title || !fields.publisher) return null;
      return formatBookReference(fields);
    }
    if (sourceType === "article") {
      if (!fields.authors || !fields.title || !fields.journal) return null;
      return formatArticleReference(fields);
    }
    if (!fields.authors || !fields.title || !fields.institution) return null;
    return formatThesisReference(fields);
  }, [sourceType, fields]);

  const inTextCitation = fields.authors ? buildInTextCitation(fields.authors, fields.year) : null;

  async function handleCopy() {
    if (!reference) return;
    await copyReference(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sourceType">Tipo de fuente</Label>
        <select
          id="sourceType"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as SourceType)}
          className="h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 text-sm transition-shadow focus-visible:shadow-sm"
        >
          {Object.entries(SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {sourceType === "article" && (
        <form action={doiAction} className="flex gap-2">
          <Input name="doi" placeholder="DOI (ej. 10.1000/xyz123)" className="max-w-sm" />
          <Button type="submit" variant="outline" disabled={doiPending}>
            {doiPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Buscar por DOI
          </Button>
        </form>
      )}
      {doiState && "error" in doiState && (
        <p className="text-sm text-destructive">{doiState.error}</p>
      )}

      {sourceType === "webpage" && (
        <form action={urlAction} className="flex gap-2">
          <Input name="url" placeholder="https://..." className="max-w-sm" />
          <Button type="submit" variant="outline" disabled={urlPending}>
            {urlPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Autocompletar
          </Button>
        </form>
      )}
      {urlState && "error" in urlState && (
        <p className="text-sm text-destructive">{urlState.error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sourceType !== "webpage" && (
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="authors">Autores</Label>
            <Input
              id="authors"
              value={fields.authors}
              onChange={(e) => update("authors", e.target.value)}
              placeholder="Apellido, A. A.; Apellido, B. B."
            />
          </div>
        )}
        {sourceType === "webpage" && (
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="authors">Autor (opcional)</Label>
            <Input
              id="authors"
              value={fields.authors}
              onChange={(e) => update("authors", e.target.value)}
              placeholder="Apellido, A. A. (déjalo vacío si no hay autor)"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="year">Año</Label>
          <Input id="year" value={fields.year} onChange={(e) => update("year", e.target.value)} placeholder="2024" />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" value={fields.title} onChange={(e) => update("title", e.target.value)} />
        </div>

        {sourceType === "webpage" && (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="siteName">Nombre del sitio</Label>
              <Input id="siteName" value={fields.siteName} onChange={(e) => update("siteName", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" value={fields.url} onChange={(e) => update("url", e.target.value)} />
            </div>
          </>
        )}

        {sourceType === "book" && (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edition">Edición (opcional)</Label>
              <Input id="edition" value={fields.edition} onChange={(e) => update("edition", e.target.value)} placeholder="2da ed." />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="publisher">Editorial</Label>
              <Input id="publisher" value={fields.publisher} onChange={(e) => update("publisher", e.target.value)} />
            </div>
          </>
        )}

        {sourceType === "article" && (
          <>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="journal">Revista</Label>
              <Input id="journal" value={fields.journal} onChange={(e) => update("journal", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="volume">Volumen</Label>
              <Input id="volume" value={fields.volume} onChange={(e) => update("volume", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="issue">Número</Label>
              <Input id="issue" value={fields.issue} onChange={(e) => update("issue", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pages">Páginas</Label>
              <Input id="pages" value={fields.pages} onChange={(e) => update("pages", e.target.value)} placeholder="12-34" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doi">DOI (opcional)</Label>
              <Input id="doi" value={fields.doi} onChange={(e) => update("doi", e.target.value)} />
            </div>
          </>
        )}

        {sourceType === "thesis" && (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="thesisType">Tipo de tesis</Label>
              <select
                id="thesisType"
                value={fields.thesisType}
                onChange={(e) => update("thesisType", e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option>Tesis de licenciatura</option>
                <option>Tesis de maestría</option>
                <option>Tesis de doctorado</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="institution">Institución</Label>
              <Input id="institution" value={fields.institution} onChange={(e) => update("institution", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="repositoryUrl">URL del repositorio (opcional)</Label>
              <Input id="repositoryUrl" value={fields.url} onChange={(e) => update("url", e.target.value)} />
            </div>
          </>
        )}
      </div>

      {reference && (
        <Card className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Referencia generada</CardTitle>
            <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="Copiar referencia">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm" dangerouslySetInnerHTML={{ __html: reference.html }} />
            {inTextCitation && (
              <p className="text-sm text-muted-foreground">
                Cita en texto: <span className="text-foreground">{inTextCitation}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
