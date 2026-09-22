"use client";

import { useState, type CSSProperties } from "react";
import { AlertTriangle, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RuleFinding, RuleSeverity } from "@/lib/rules/apa";

const SEVERITY_CONFIG: Record<
  RuleSeverity,
  { icon: typeof XCircle; className: string }
> = {
  error: { icon: XCircle, className: "text-destructive" },
  warning: { icon: AlertTriangle, className: "text-amber-600 dark:text-amber-500" },
  info: { icon: Info, className: "text-muted-foreground" },
};

export function FindingItem({
  finding,
  style,
}: {
  finding: RuleFinding;
  style?: CSSProperties;
}) {
  const [showParagraphs, setShowParagraphs] = useState(false);
  const config = SEVERITY_CONFIG[finding.severity];
  const paragraphs = finding.affectedParagraphs ?? [];

  return (
    <li
      className="animate-in fade-in-0 slide-in-from-bottom-1 rounded-lg border p-4 duration-300"
      style={style}
    >
      <div className="flex items-center gap-2">
        <config.icon className={`h-4 w-4 shrink-0 ${config.className}`} />
        <span className="font-medium">{finding.type}</span>
        <Badge variant="secondary">{finding.location}</Badge>
      </div>
      <p className="mt-2 text-sm">{finding.description}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Recomendación: {finding.recommendation}
      </p>

      {paragraphs.length > 0 && (
        <div className="mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowParagraphs((v) => !v)}
            className="h-auto p-0 text-xs font-normal underline underline-offset-4"
          >
            {showParagraphs ? "Ocultar párrafos" : `Ver párrafos (${paragraphs.length})`}
          </Button>
          {showParagraphs && (
            <div className="mt-2 flex flex-wrap gap-1">
              {paragraphs.map((n) => (
                <Badge key={n} variant="secondary">
                  Párrafo {n}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
