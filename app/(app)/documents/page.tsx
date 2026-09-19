import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function DocumentsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Mis documentos"
      description="La subida y gestión de documentos llega en una próxima fase (almacenamiento con Supabase Storage)."
    />
  );
}
