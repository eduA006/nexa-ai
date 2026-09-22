"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FindingItem } from "@/components/tools/finding-item";
import type { RuleFinding, RuleSeverity } from "@/lib/rules/apa";

const SEVERITY_ORDER: Record<RuleSeverity, number> = { error: 0, warning: 1, info: 2 };
const INITIAL_VISIBLE = 5;

function scoreColorClass(score: number): string {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-500";
  if (score >= 60) return "text-amber-600 dark:text-amber-500";
  return "text-destructive";
}

function scoreBarClass(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-destructive";
}

export function FindingSection({
  title,
  description,
  score,
  findings,
}: {
  title: string;
  description: string;
  score: number;
  findings: RuleFinding[];
}) {
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(
    () => [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    [findings],
  );
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hiddenCount = sorted.length - visible.length;

  const counts = useMemo(() => {
    const base: Record<RuleSeverity, number> = { error: 0, warning: 0, info: 0 };
    sorted.forEach((f) => base[f.severity]++);
    return base;
  }, [sorted]);

  return (
    <div className="flex flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          <span className={`text-sm font-semibold ${scoreColorClass(score)}`}>
            {score}/100
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreBarClass(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        {sorted.length > 0 && (
          <div className="mt-3 flex gap-2">
            {counts.error > 0 && <Badge variant="secondary">{counts.error} errores</Badge>}
            {counts.warning > 0 && (
              <Badge variant="secondary">{counts.warning} advertencias</Badge>
            )}
            {counts.info > 0 && <Badge variant="secondary">{counts.info} info</Badge>}
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No se encontraron observaciones.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {visible.map((finding, index) => (
              <FindingItem
                key={index}
                finding={finding}
                style={{ animationDelay: `${index * 40}ms`, animationFillMode: "backwards" }}
              />
            ))}
          </ul>
          {hiddenCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAll(true)}
              className="w-fit"
            >
              Mostrar {hiddenCount} más
            </Button>
          )}
          {showAll && sorted.length > INITIAL_VISIBLE && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(false)}
              className="w-fit"
            >
              Mostrar menos
            </Button>
          )}
        </>
      )}
    </div>
  );
}
