"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

/**
 * Botón único para alternar entre el tema Retro (Windows 98) y el tema
 * Moderno — misma marcación `.win98-*` en toda la app, la piel visual
 * cambia por completo vía `app/globals.css` según la clase `.modern`
 * en `<html>` (ver ThemeProvider en app/layout.tsx).
 */
export function ThemeModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className={cn("win98-btn h-8 w-8 shrink-0 bg-secondary", className)} />;
  }

  const isModern = theme === "modern";

  return (
    <button
      type="button"
      onClick={() => setTheme(isModern ? "retro" : "modern")}
      aria-label={isModern ? "Cambiar a modo retro" : "Cambiar a modo moderno"}
      title={isModern ? "Cambiar a modo retro" : "Cambiar a modo moderno"}
      className={cn(
        "win98-btn flex h-8 w-8 shrink-0 items-center justify-center bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {isModern ? <Monitor className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
    </button>
  );
}
