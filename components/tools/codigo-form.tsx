"use client";

import { useActionState, useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { runCodigoAssist, type CodigoActionState } from "@/lib/tools/codigo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FindingSection } from "@/components/tools/finding-section";

const ACTIONS = [
  { value: "explicar", label: "Explicar" },
  { value: "corregir", label: "Corregir" },
  { value: "mejorar", label: "Mejorar" },
  { value: "documentar", label: "Documentar" },
] as const;

export function CodigoForm() {
  const [state, action, pending] = useActionState<CodigoActionState, FormData>(
    runCodigoAssist,
    undefined,
  );
  const [copied, setCopied] = useState(false);

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;

  async function handleCopy() {
    if (!result?.resultCode) return;
    await navigator.clipboard.writeText(result.resultCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="language">Lenguaje (opcional)</Label>
            <Input id="language" name="language" placeholder="ej. Python, JavaScript…" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="action">Acción</Label>
            <select
              id="action"
              name="action"
              defaultValue="explicar"
              className="h-9 rounded-md win98-well border border-input bg-input px-3 text-sm transition-shadow focus-visible:shadow-sm"
            >
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Código</Label>
          <textarea
            id="code"
            name="code"
            required
            rows={14}
            placeholder="Pega tu código aquí…"
            className="w-full rounded-md win98-well border border-input bg-input p-3 font-mono text-sm transition-shadow focus-visible:shadow-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-fit transition-transform active:scale-[0.98]"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Procesando…" : "Enviar"}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <p className="text-sm text-muted-foreground">{result.summary}</p>

          {result.explanation && (
            <p className="whitespace-pre-line text-sm">{result.explanation}</p>
          )}

          {result.findings.length > 0 && (
            <FindingSection
              title="Observaciones"
              description="Errores y sugerencias detectados en el código."
              score={Math.max(
                0,
                100 -
                  result.findings.filter((f) => f.severity === "error").length * 15 -
                  result.findings.filter((f) => f.severity !== "error").length * 5,
              )}
              findings={result.findings}
            />
          )}

          {result.resultCode && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Código resultante</Label>
                <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="Copiar código">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <pre className="win98-well overflow-x-auto bg-input p-3 font-mono text-sm">
                <code>{result.resultCode}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
