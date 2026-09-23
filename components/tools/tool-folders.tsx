"use client";

import { useState } from "react";
import Link from "next/link";
import { Folder, FolderOpen } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RetroWindow } from "@/components/retro/title-bar";
import type { ToolCategory } from "@/components/tools/catalog";

function CategoryFolderIcon({
  category,
  isOpen,
  onToggle,
}: {
  category: ToolCategory;
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
      <span className="text-xs leading-tight font-medium break-words">{category.category}</span>
      <span className="text-[11px] text-muted-foreground">
        {category.tools.length} herramienta{category.tools.length === 1 ? "" : "s"}
      </span>
    </button>
  );
}

/**
 * Vista de "carpetas" al estilo Explorador de Windows: cada categoría
 * es un ícono de carpeta; al hacer clic se abre como una ventana propia
 * con la grilla de herramientas de esa categoría, en vez de mostrar
 * todo aplanado en una sola grilla larga.
 */
export function ToolFolders({ categories }: { categories: ToolCategory[] }) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(categories.length > 0 ? [categories[0].category] : []),
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
        {categories.map((cat) => (
          <CategoryFolderIcon
            key={cat.category}
            category={cat}
            isOpen={openCategories.has(cat.category)}
            onToggle={() => toggle(cat.category)}
          />
        ))}
      </div>

      {categories
        .filter((cat) => openCategories.has(cat.category))
        .map((cat) => (
          <RetroWindow
            key={cat.category}
            title={`${cat.category} — Propiedades`}
            icon={<FolderOpen className="h-3.5 w-3.5" />}
            onClose={() => toggle(cat.category)}
            className="animate-in fade-in-0 slide-in-from-top-1 duration-300"
          >
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.tools.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                  <Card className="h-full hover:bg-muted/50">
                    <CardHeader>
                      <tool.icon className="h-5 w-5" />
                      <CardTitle className="mt-2 text-base">{tool.name}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </RetroWindow>
        ))}
    </div>
  );
}
