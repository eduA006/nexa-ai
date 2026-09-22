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
  type LucideIcon,
} from "lucide-react";

export type ToolCatalogItem = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Si está implementada, enlaza a /tools/{slug} en vez de mostrar "Próximamente". */
  available?: boolean;
};

export const STUDENT_TOOLS: ToolCatalogItem[] = [
  { slug: "apa", name: "Corrector APA 7", description: "Analiza formato y estructura APA con reglas y IA.", icon: FileCheck2, available: true },
  { slug: "analizador-escritura", name: "Analizador de escritura", description: "Indicadores probabilísticos sobre el estilo del texto.", icon: ScanSearch, available: true },
  { slug: "corrector-redaccion", name: "Corrector de redacción", description: "Ortografía, gramática, claridad y cohesión.", icon: SpellCheck2, available: true },
  { slug: "resumir", name: "Resumir documento", description: "Resumen breve, detallado, ideas clave y conclusiones.", icon: FileText, available: true },
  { slug: "chat-documento", name: "Chat con documento", description: "Pregunta sobre el contenido de tus archivos.", icon: MessagesSquare, available: true },
  { slug: "referencias-apa", name: "Generador de referencias APA", description: "A partir de URL, DOI, libro, artículo o tesis.", icon: BookMarked, available: true },
  { slug: "bibliografia", name: "Analizador de bibliografía", description: "Compara citas del texto contra las referencias.", icon: ListChecks, available: true },
  { slug: "exposiciones", name: "Preparador de exposiciones", description: "Estructura, guion y posibles preguntas.", icon: Presentation, available: true },
  { slug: "presentaciones", name: "Generador de presentaciones", description: "Estructura de diapositivas a partir de un documento.", icon: LayoutPanelTop, available: true },
  { slug: "programacion", name: "Ayudante de programación", description: "Explica, corrige, mejora y documenta código.", icon: Code2, available: true },
];

export const PROFESSIONAL_TOOLS: ToolCatalogItem[] = [
  { slug: "analizador-cv", name: "Analizador de CV", description: "Estructura, claridad, logros y consistencia.", icon: FileUser, available: true },
  { slug: "generador-cv", name: "Generador de CV", description: "A partir de tus datos, experiencia y habilidades.", icon: FilePlus2, available: true },
  { slug: "documentos", name: "Generador de documentos", description: "Informes, memorandos, cartas y propuestas.", icon: FileText, available: true },
  { slug: "correos", name: "Asistente de correos", description: "Redactar, mejorar, resumir o cambiar el tono.", icon: MailPlus, available: true },
  { slug: "excel-csv", name: "Analizador de Excel/CSV", description: "Resumen de datos, estadísticas y tendencias.", icon: Sheet, available: true },
  { slug: "analizador-documentos", name: "Analizador de documentos", description: "Fechas, montos, personas y obligaciones clave.", icon: FileSearch, available: true },
  { slug: "informes", name: "Generador de informes", description: "De datos a informe en DOCX/PDF.", icon: ClipboardList, available: true },
  { slug: "reuniones", name: "Resumen de reuniones", description: "Decisiones, tareas, responsables y fechas.", icon: Users, available: true },
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
