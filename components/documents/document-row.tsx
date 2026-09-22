"use client";

import { useState, useTransition } from "react";
import { Download, Trash2, Loader2, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteDocument, getDownloadUrl } from "@/lib/documents/actions";
import type { Document } from "@/lib/documents/queries";

const STATUS_LABEL: Record<string, string> = {
  uploaded: "Subido",
  processing: "Procesando",
  processed: "Procesado",
  error: "Error",
};

const TYPE_LABEL: Record<string, string> = {
  pdf: "PDF",
  docx: "DOCX",
  xlsx: "XLSX",
  csv: "CSV",
};

export function DocumentRow({ doc }: { doc: Document }) {
  const [isDeleting, startDelete] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [downloadingCorrected, setDownloadingCorrected] = useState(false);

  async function handleDownload() {
    // Abre la pestaña de inmediato (dentro del gesto de clic) y la navega
    // luego: si se espera al await antes de window.open(), varios
    // navegadores lo bloquean por no parecer originado por el usuario.
    const tab = window.open("", "_blank", "noopener,noreferrer");
    setDownloading(true);
    try {
      const url = await getDownloadUrl(doc.storage_path);
      if (url && tab) {
        tab.location.href = url;
      } else {
        tab?.close();
      }
    } catch (err) {
      console.error("[Documents] Error al descargar:", err);
      tab?.close();
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadCorrected() {
    if (!doc.processed_storage_path) return;
    const tab = window.open("", "_blank", "noopener,noreferrer");
    setDownloadingCorrected(true);
    try {
      const url = await getDownloadUrl(doc.processed_storage_path);
      if (url && tab) {
        tab.location.href = url;
      } else {
        tab?.close();
      }
    } catch (err) {
      console.error("[Documents] Error al descargar versión corregida:", err);
      tab?.close();
    } finally {
      setDownloadingCorrected(false);
    }
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar "${doc.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    startDelete(() => deleteDocument(doc.id));
  }

  return (
    <tr className="border-b last:border-0">
      <td className="max-w-[16rem] truncate py-3 pr-4 pl-4 font-medium">{doc.name}</td>
      <td className="py-3 pr-4">
        <Badge variant="secondary">{TYPE_LABEL[doc.file_type] ?? doc.file_type}</Badge>
      </td>
      <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
        {new Date(doc.created_at).toLocaleDateString("es-PE")}
      </td>
      <td className="py-3 pr-4 text-muted-foreground">
        {STATUS_LABEL[doc.status] ?? doc.status}
      </td>
      <td className="py-3 text-right whitespace-nowrap">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDownload}
          disabled={downloading}
          aria-label="Descargar"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
        {doc.processed_storage_path && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleDownloadCorrected}
            disabled={downloadingCorrected}
            aria-label="Descargar versión corregida"
            title="Descargar versión corregida"
          >
            {downloadingCorrected ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck2 className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
