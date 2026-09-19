import {
  Home,
  FileText,
  Wrench,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/documents", label: "Mis documentos", icon: FileText },
  { href: "/tools", label: "Herramientas", icon: Wrench },
  { href: "/history", label: "Historial", icon: History },
  { href: "/settings", label: "Configuración", icon: Settings },
];
