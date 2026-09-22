"use client";

import { useActionState, useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { runCorreoAssist, type CorreoActionState } from "@/lib/tools/correos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIONS = [
  { value: "redactar", label: "Redactar" },
  { value: "mejorar", label: "Mejorar" },
  { value: "resumir", label: "Resumir" },
  { value: "tono", label: "Cambiar tono" },
] as const;

type ActionValue = (typeof ACTIONS)[number]["value"];

const TEXT_LABEL: Record<ActionValue, string> = {
  redactar: "Instrucciones (a quién, de qué trata, qué buscas lograr)",
  mejorar: "Correo a mejorar",
  resumir: "Correo o hilo a resumir",
  tono: "Correo a reescribir",
};

export function CorreosForm() {
  const [state, action, pending] = useActionState<CorreoActionState, FormData>(
    runCorreoAssist,
    undefined,
  );
  const [selectedAction, setSelectedAction] = useState<ActionValue>("redactar");
  const [copied, setCopied] = useState(false);

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;
  const showTone = selectedAction === "redactar" || selectedAction === "tono";

  async function handleCopy() {
    if (!result) return;
    const text = result.subject ? `Asunto: ${result.subject}\n\n${result.body}` : result.body;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-col gap-2">
            <Label htmlFor="action">Acción</Label>
            <select
              id="action"
              name="action"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as ActionValue)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm transition-shadow focus-visible:shadow-sm"
            >
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          {showTone && (
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="tone">Tono deseado</Label>
              <Input id="tone" name="tone" placeholder="ej. formal, cercano, directo…" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="text">{TEXT_LABEL[selectedAction]}</Label>
          <textarea
            id="text"
            name="text"
            required
            rows={10}
            className="w-full rounded-md border border-input bg-transparent p-3 text-sm transition-shadow focus-visible:shadow-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-fit transition-transform active:scale-[0.98]"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Generando…" : "Generar"}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <Card className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Resultado</CardTitle>
            <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="Copiar">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {result.subject && (
              <p className="text-sm">
                <span className="font-medium">Asunto: </span>
                {result.subject}
              </p>
            )}
            <p className="whitespace-pre-line text-sm text-muted-foreground">{result.body}</p>
            {result.notes && (
              <p className="border-t pt-2 text-xs text-muted-foreground">
                <span className="font-medium">Notas: </span>
                {result.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
