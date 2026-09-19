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
  { slug: "analizador-escritura", name: "Analizador de escritura", description: "Indicadores probabilísticos sobre el estilo del texto.", icon: ScanSearch },
  { slug: "corrector-redaccion", name: "Corrector de redacción", description: "Ortografía, gramática, claridad y cohesión.", icon: SpellCheck2 },
  { slug: "resumir", name: "Resumir documento", description: "Resumen breve, detallado, ideas clave y conclusiones.", icon: FileText },
  { slug: "chat-documento", name: "Chat con documento", description: "Pregunta sobre el contenido de tus archivos.", icon: MessagesSquare },
  { slug: "referencias-apa", name: "Generador de referencias APA", description: "A partir de URL, DOI, libro, artículo o tesis.", icon: BookMarked },
  { slug: "bibliografia", name: "Analizador de bibliografía", description: "Compara citas del texto contra las referencias.", icon: ListChecks },
  { slug: "exposiciones", name: "Preparador de exposiciones", description: "Estructura, guion y posibles preguntas.", icon: Presentation },
  { slug: "presentaciones", name: "Generador de presentaciones", description: "Estructura de diapositivas a partir de un documento.", icon: LayoutPanelTop },
  { slug: "programacion", name: "Ayudante de programación", description: "Explica, corrige, mejora y documenta código.", icon: Code2 },
];

export const PROFESSIONAL_TOOLS: ToolCatalogItem[] = [
  { slug: "analizador-cv", name: "Analizador de CV", description: "Estructura, claridad, logros y consistencia.", icon: FileUser },
  { slug: "generador-cv", name: "Generador de CV", description: "A partir de tus datos, experiencia y habilidades.", icon: FilePlus2 },
  { slug: "documentos", name: "Generador de documentos", description: "Informes, memorandos, cartas y propuestas.", icon: FileText },
  { slug: "correos", name: "Asistente de correos", description: "Redactar, mejorar, resumir o cambiar el tono.", icon: MailPlus },
  { slug: "excel-csv", name: "Analizador de Excel/CSV", description: "Resumen de datos, estadísticas y tendencias.", icon: Sheet },
  { slug: "analizador-documentos", name: "Analizador de documentos", description: "Fechas, montos, personas y obligaciones clave.", icon: FileSearch },
  { slug: "informes", name: "Generador de informes", description: "De datos a informe en DOCX/PDF.", icon: ClipboardList },
  { slug: "reuniones", name: "Resumen de reuniones", description: "Decisiones, tareas, responsables y fechas.", icon: Users },
];

export const RECOMMENDED_TOOLS: Record<string, ToolCatalogItem[]> = {
  student: STUDENT_TOOLS.slice(0, 3),
  professional: PROFESSIONAL_TOOLS.slice(0, 3),
};
