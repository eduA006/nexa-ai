import {
  FileCheck2,
  ScanSearch,
  SpellCheck2,
  FileText,
  MessagesSquare,
  BookMarked,
  ListChecks,
  Presentation,
  LayoutPanelTop,
  Code2,
  FileUser,
  FilePlus2,
  MailPlus,
  Sheet,
  FileSearch,
  ClipboardList,
  Users,
  Layers,
  type LucideIcon,
} from "lucide-react";

export type ToolCatalogItem = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
};

export const STUDENT_TOOLS: ToolCatalogItem[] = [
  { slug: "apa", name: "Corrector APA 7", description: "Analiza formato y estructura APA con reglas y IA.", icon: FileCheck2, category: "Formato y citas" },
  { slug: "referencias-apa", name: "Generador de referencias APA", description: "A partir de URL, DOI, libro, artículo o tesis.", icon: BookMarked, category: "Formato y citas" },
  { slug: "bibliografia", name: "Analizador de bibliografía", description: "Compara citas del texto contra las referencias.", icon: ListChecks, category: "Formato y citas" },
  { slug: "analizador-escritura", name: "Analizador de escritura", description: "Indicadores probabilísticos sobre el estilo del texto.", icon: ScanSearch, category: "Escritura" },
  { slug: "corrector-redaccion", name: "Corrector de redacción", description: "Ortografía, gramática, claridad y cohesión.", icon: SpellCheck2, category: "Escritura" },
  { slug: "resumir", name: "Resumir documento", description: "Resumen breve, detallado, ideas clave y conclusiones.", icon: FileText, category: "Documentos" },
  { slug: "chat-documento", name: "Chat con documento", description: "Pregunta sobre el contenido de tus archivos.", icon: MessagesSquare, category: "Documentos" },
  { slug: "exposiciones", name: "Preparador de exposiciones", description: "Estructura, guion y posibles preguntas.", icon: Presentation, category: "Exposiciones" },
  { slug: "presentaciones", name: "Generador de presentaciones", description: "Estructura de diapositivas a partir de un documento.", icon: LayoutPanelTop, category: "Exposiciones" },
  { slug: "flashcards", name: "Flashcards", description: "Tarjetas de pregunta y respuesta para practicar recuerdo activo.", icon: Layers, category: "Estudio" },
  { slug: "programacion", name: "Ayudante de programación", description: "Explica, corrige, mejora y documenta código.", icon: Code2, category: "Programación" },
];

export const PROFESSIONAL_TOOLS: ToolCatalogItem[] = [
  { slug: "analizador-cv", name: "Analizador de CV", description: "Estructura, claridad, logros y consistencia.", icon: FileUser, category: "CV y carrera" },
  { slug: "generador-cv", name: "Generador de CV", description: "A partir de tus datos, experiencia y habilidades.", icon: FilePlus2, category: "CV y carrera" },
  { slug: "documentos", name: "Generador de documentos", description: "Informes, memorandos, cartas y propuestas.", icon: FileText, category: "Documentos e informes" },
  { slug: "informes", name: "Generador de informes", description: "De datos a informe en DOCX/PDF.", icon: ClipboardList, category: "Documentos e informes" },
  { slug: "analizador-documentos", name: "Analizador de documentos", description: "Fechas, montos, personas y obligaciones clave.", icon: FileSearch, category: "Documentos e informes" },
  { slug: "excel-csv", name: "Analizador de Excel/CSV", description: "Resumen de datos, estadísticas y tendencias.", icon: Sheet, category: "Datos" },
  { slug: "correos", name: "Asistente de correos", description: "Redactar, mejorar, resumir o cambiar el tono.", icon: MailPlus, category: "Comunicación" },
  { slug: "reuniones", name: "Resumen de reuniones", description: "Decisiones, tareas, responsables y fechas.", icon: Users, category: "Comunicación" },
];

export const RECOMMENDED_TOOLS: Record<string, ToolCatalogItem[]> = {
  student: STUDENT_TOOLS.slice(0, 3),
  professional: PROFESSIONAL_TOOLS.slice(0, 3),
};

export const ALL_TOOLS: ToolCatalogItem[] = [...STUDENT_TOOLS, ...PROFESSIONAL_TOOLS];

const TOOLS_BY_SLUG = new Map(ALL_TOOLS.map((tool) => [tool.slug, tool]));

/** Busca una herramienta del catálogo por slug (ej. el valor `tool` de `ai_sessions`). */
export function getToolBySlug(slug: string): ToolCatalogItem | undefined {
  return TOOLS_BY_SLUG.get(slug);
}

export type ToolCategory = { category: string; tools: ToolCatalogItem[] };

/** Agrupa una lista de herramientas por categoría, preservando el orden de primera aparición. */
export function groupByCategory(tools: ToolCatalogItem[]): ToolCategory[] {
  const groups: ToolCategory[] = [];
  const indexByCategory = new Map<string, number>();

  for (const tool of tools) {
    let index = indexByCategory.get(tool.category);
    if (index === undefined) {
      index = groups.length;
      indexByCategory.set(tool.category, index);
      groups.push({ category: tool.category, tools: [] });
    }
    groups[index].tools.push(tool);
  }

  return groups;
}
