"use client";

import { useActionState, useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { runGeneradorCv, type GeneradorCvActionState } from "@/lib/tools/generador-cv/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeneratedCv } from "@/lib/ai/prompts/generador-cv";

function cvAsText(cv: GeneratedCv): string {
  const lines = [cv.fullName, cv.headerLine, "", "PERFIL", cv.profile, ""];

  if (cv.experience.length > 0) {
    lines.push("EXPERIENCIA");
    for (const exp of cv.experience) {
      lines.push(`${exp.role} — ${exp.company} (${exp.period})`);
      lines.push(...exp.bullets.map((b) => `• ${b}`));
      lines.push("");
    }
  }

  if (cv.education.length > 0) {
    lines.push("EDUCACIÓN");
    for (const edu of cv.education) {
      lines.push(`${edu.degree} — ${edu.institution} (${edu.period})`);
    }
    lines.push("");
  }

  if (cv.skills.length > 0) {
    lines.push("HABILIDADES");
    lines.push(cv.skills.join(", "));
  }

  return lines.join("\n");
}

export function GeneradorCvForm() {
  const [state, action, pending] = useActionState<GeneradorCvActionState, FormData>(
    runGeneradorCv,
    undefined,
  );
  const [copied, setCopied] = useState(false);

  const result = state && "result" in state ? state.result : null;
  const error = state && "error" in state ? state.error : null;

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(cvAsText(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Ubicación (opcional)</Label>
            <Input id="location" name="location" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="targetRole">Puesto objetivo (opcional)</Label>
            <Input id="targetRole" name="targetRole" placeholder="ej. Analista de datos" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="profileNotes">Perfil profesional (opcional, la IA lo redacta si lo dejas vacío)</Label>
          <textarea
            id="profileNotes"
            name="profileNotes"
            rows={3}
            className="w-full rounded-md border border-input bg-transparent p-3 text-sm transition-shadow focus-visible:shadow-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="experienceNotes">Experiencia laboral (en tus palabras: empresa, cargo, fechas, logros)</Label>
          <textarea
            id="experienceNotes"
            name="experienceNotes"
            rows={6}
            className="w-full rounded-md border border-input bg-transparent p-3 text-sm transition-shadow focus-visible:shadow-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="educationNotes">Educación (institución, título, fechas)</Label>
          <textarea
            id="educationNotes"
            name="educationNotes"
            rows={3}
            className="w-full rounded-md border border-input bg-transparent p-3 text-sm transition-shadow focus-visible:shadow-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="skillsNotes">Habilidades</Label>
          <textarea
            id="skillsNotes"
            name="skillsNotes"
            rows={2}
            className="w-full rounded-md border border-input bg-transparent p-3 text-sm transition-shadow focus-visible:shadow-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-fit transition-transform active:scale-[0.98]"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Generando…" : "Generar CV"}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <Card className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">CV generado</CardTitle>
            <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="Copiar CV">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-lg font-semibold">{result.fullName}</p>
              <p className="text-sm text-muted-foreground">{result.headerLine}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Perfil</p>
              <p className="mt-1 text-sm text-muted-foreground">{result.profile}</p>
            </div>

            {result.experience.length > 0 && (
              <div>
                <p className="text-sm font-medium">Experiencia</p>
                <div className="mt-2 flex flex-col gap-3">
                  {result.experience.map((exp, index) => (
                    <div key={index}>
                      <p className="text-sm font-medium">
                        {exp.role} — {exp.company}{" "}
                        <span className="font-normal text-muted-foreground">({exp.period})</span>
                      </p>
                      <ul className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
                        {exp.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="flex gap-2">
                            <span className="text-foreground">•</span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.education.length > 0 && (
              <div>
                <p className="text-sm font-medium">Educación</p>
                <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {result.education.map((edu, index) => (
                    <p key={index}>
                      {edu.degree} — {edu.institution} ({edu.period})
                    </p>
                  ))}
                </div>
              </div>
            )}

            {result.skills.length > 0 && (
              <div>
                <p className="text-sm font-medium">Habilidades</p>
                <p className="mt-1 text-sm text-muted-foreground">{result.skills.join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
