"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
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
    return <div className="h-9 w-64 rounded-md bg-muted" />;
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
            theme === option.value ? "border-foreground bg-muted" : "hover:bg-muted",
          )}
        >
          <option.icon className="h-4 w-4" />
          {option.label}
        </button>
      ))}
    </div>
  );
}
