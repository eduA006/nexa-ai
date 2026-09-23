import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Botoncito cuadrado de la barra de título (_, □, x). Funcional solo si recibe onClick. */
function TitleBarButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const className =
    "win98-titlebar-btn flex h-[18px] w-[18px] items-center justify-center bg-secondary text-[11px] leading-none font-bold text-secondary-foreground";

  if (onClick) {
    return (
      <button type="button" aria-label={label} onClick={onClick} className={className}>
        {children}
      </button>
    );
  }

  return (
    <span role="presentation" aria-label={label} className={className}>
      {children}
    </span>
  );
}

/**
 * Barra de título clásica de Windows 98: ícono + texto a la izquierda,
 * botones de minimizar/maximizar/cerrar a la derecha. Minimizar/maximizar
 * son siempre decorativos (chrome visual); cerrar es funcional si se pasa
 * `onClose`.
 */
export function TitleBar({
  title,
  icon,
  className,
  onClose,
}: {
  title: string;
  icon?: ReactNode;
  className?: string;
  onClose?: () => void;
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
        <TitleBarButton label="Cerrar" onClick={onClose}>×</TitleBarButton>
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
  onClose,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  titleBarClassName?: string;
  onClose?: () => void;
}) {
  return (
    <div className={cn("win98-panel flex flex-col bg-card text-sm text-card-foreground", className)}>
      <TitleBar title={title} icon={icon} className={titleBarClassName} onClose={onClose} />
      {children}
    </div>
  );
}
