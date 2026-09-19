import { FileText } from "lucide-react";
import { getUserDocuments } from "@/lib/documents/queries";
import { LIMITS } from "@/lib/config/limits";
import { UploadForm } from "@/components/documents/upload-form";
import { DocumentRow } from "@/components/documents/document-row";

export default async function DocumentsPage() {
  const documents = await getUserDocuments();

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mis documentos</h1>
        <p className="text-muted-foreground">
          Sube tus archivos para poder analizarlos con las herramientas de
          NEXA AI (disponibles en próximas fases).
        </p>
      </div>

      <UploadForm maxSizeMb={LIMITS.MAX_FILE_SIZE_MB} />

      {documents.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aún no has subido ningún documento.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 pl-4 font-medium">Nombre</th>
                <th className="py-2 pr-4 font-medium">Tipo</th>
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 pr-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="px-4">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
