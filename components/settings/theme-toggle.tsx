"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "retro", label: "Retro", description: "Windows 98/95 clásico", icon: Monitor },
  { value: "modern", label: "Moderno", description: "Interfaz limpia y actual", icon: Palette },
] as const;

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className="win98-well h-16 w-64 bg-input" />;
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          className={cn(
            "win98-btn flex flex-1 flex-col items-center gap-1 px-3 py-2.5 text-sm font-medium",
            theme === option.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          <option.icon className="h-4 w-4" />
          {option.label}
          <span
            className={cn(
              "text-xs font-normal",
              theme === option.value ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {option.description}
          </span>
        </button>
      ))}
    </div>
  );
}
