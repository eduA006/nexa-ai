"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  runAnalizadorDocumentos,
  type AnalizadorDocumentosActionState,
} from "@/lib/tools/analizador-documentos/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Document } from "@/lib/documents/queries";

export function AnalizadorDocumentosForm({ documents }: { documents: Document[] }) {
  const [state, action, pending] = useActionState<AnalizadorDocumentosActionState, FormData>(
    runAnalizadorDocumentos,
    undefined,
  );

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          name="documentId"
          required
          disabled={documents.length === 0}
          className="h-9 flex-1 rounded-md win98-well border border-input bg-input px-3 text-sm transition-shadow focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecciona un documento DOCX…</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          disabled={pending || documents.length === 0}
          className="transition-transform active:scale-[0.98]"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Analizando…" : "Extraer datos"}
        </Button>
      </form>

      {documents.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tienes documentos DOCX subidos. Sube uno en{" "}
          <a href="/documents" className="underline underline-offset-4">
            Mis documentos
          </a>
          .
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <p className="text-xs text-muted-foreground">
            Esto es extracción automática de referencia, NO es asesoría legal. No
            evalúa si una cláusula es riesgosa o desfavorable — verifica todo con un
            profesional antes de tomar decisiones.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fechas</CardTitle>
              </CardHeader>
              <CardContent>
                {result.dates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No se detectaron fechas.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {result.dates.map((date, index) => (
                      <Badge key={index} variant="secondary">
                        {date}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Montos</CardTitle>
              </CardHeader>
              <CardContent>
                {result.amounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No se detectaron montos.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {result.amounts.map((amount, index) => (
                      <Badge key={index} variant="secondary">
                        {amount}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personas / partes</CardTitle>
            </CardHeader>
            <CardContent>
              {result.people.length === 0 ? (
                <p className="text-sm text-muted-foreground">No se detectaron personas o partes.</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {result.people.map((person, index) => (
                    <li key={index}>
                      <span className="text-foreground">{person.name}</span> — {person.role}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Obligaciones clave</CardTitle>
            </CardHeader>
            <CardContent>
              {result.obligations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No se detectaron obligaciones claras.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {result.obligations.map((obligation, index) => (
                    <div key={index} className="rounded-lg border p-3">
                      <Badge variant="secondary">{obligation.party}</Badge>
                      <p className="mt-1 text-sm text-muted-foreground">{obligation.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
