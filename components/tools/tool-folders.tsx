"use client";

import { useState, type ReactNode } from "react";
import { Folder, FolderOpen } from "lucide-react";
import { RetroWindow } from "@/components/retro/title-bar";

export type ToolFolder = {
  category: string;
  count: number;
  content: ReactNode;
};

function CategoryFolderIcon({
  folder,
  isOpen,
  onToggle,
}: {
  folder: ToolFolder;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = isOpen ? FolderOpen : Folder;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="win98-btn-flat flex w-24 flex-col items-center gap-1 p-2 text-center"
    >
      <Icon className="h-10 w-10 fill-amber-300 text-amber-700" strokeWidth={1.5} />
      <span className="text-xs leading-tight font-medium break-words">{folder.category}</span>
      <span className="text-[11px] text-muted-foreground">
        {folder.count} herramienta{folder.count === 1 ? "" : "s"}
      </span>
    </button>
  );
}

/**
 * Vista de "carpetas" al estilo Explorador de Windows: cada categoría
 * es un ícono de carpeta; al hacer clic se abre como una ventana propia
 * con la grilla de herramientas de esa categoría, en vez de mostrar
 * todo aplanado en una sola grilla larga. El contenido de cada carpeta
 * ya viene renderizado desde el Server Component padre (los íconos de
 * herramienta son referencias a funciones, no serializables como prop
 * de servidor a cliente).
 */
export function ToolFolders({ folders }: { folders: ToolFolder[] }) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(folders.length > 0 ? [folders[0].category] : []),
  );

  function toggle(category: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="win98-well flex flex-wrap gap-3 bg-input p-4">
        {folders.map((folder) => (
          <CategoryFolderIcon
            key={folder.category}
            folder={folder}
            isOpen={openCategories.has(folder.category)}
            onToggle={() => toggle(folder.category)}
          />
        ))}
      </div>

      {folders
        .filter((folder) => openCategories.has(folder.category))
        .map((folder) => (
          <RetroWindow
            key={folder.category}
            title={`${folder.category} — Propiedades`}
            icon={<FolderOpen className="h-3.5 w-3.5" />}
            onClose={() => toggle(folder.category)}
            className="animate-in fade-in-0 slide-in-from-top-1 duration-300"
          >
            {folder.content}
          </RetroWindow>
        ))}
    </div>
  );
}
