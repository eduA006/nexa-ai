import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Botoncito cuadrado decorativo de la barra de título (_, □, x). */
function TitleBarButton({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span
      role="presentation"
      aria-label={label}
      className="win98-titlebar-btn flex h-[18px] w-[18px] items-center justify-center bg-secondary text-[11px] leading-none font-bold text-secondary-foreground"
    >
      {children}
    </span>
  );
}

/**
 * Barra de título clásica de Windows 98: ícono + texto a la izquierda,
 * botones decorativos de minimizar/maximizar/cerrar a la derecha (no
 * funcionales — es chrome visual, no una ventana de verdad).
 */
export function TitleBar({
  title,
  icon,
  className,
}: {
  title: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("win98-titlebar flex items-center justify-between gap-2 py-0.5 pr-0.5 pl-1.5", className)}>
      <div className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
        {icon}
        <span className="truncate">{title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <TitleBarButton label="Minimizar">_</TitleBarButton>
        <TitleBarButton label="Maximizar">□</TitleBarButton>
        <TitleBarButton label="Cerrar">×</TitleBarButton>
      </div>
    </div>
  );
}

/** Ventana retro completa: barra de título + panel biselado con el contenido. */
export function RetroWindow({
  title,
  icon,
  children,
  className,
  titleBarClassName,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  titleBarClassName?: string;
}) {
  return (
    <div className={cn("win98-panel flex flex-col bg-card text-sm text-card-foreground", className)}>
      <TitleBar title={title} icon={icon} className={titleBarClassName} />
      {children}
    </div>
  );
}
