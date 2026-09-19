import { History } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function HistoryPage() {
  return (
    <ComingSoon
      icon={History}
      title="Historial"
      description="Aquí verás el registro de herramientas usadas, documentos procesados y resultados anteriores."
    />
  );
}
