"use client";

import { useActionState, useRef } from "react";
import { uploadDocument, type UploadActionState } from "@/lib/documents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UploadForm({ maxSizeMb }: { maxSizeMb: number }) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, action, pending] = useActionState<UploadActionState, FormData>(
    async (prevState, formData) => {
      const result = await uploadDocument(prevState, formData);
      if (!result) formRef.current?.reset();
      return result;
    },
    undefined,
  );

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="file"
          name="file"
          accept=".pdf,.docx,.xlsx,.csv"
          required
          className="flex-1"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Subiendo…" : "Subir documento"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Formatos permitidos: PDF, DOCX, XLSX, CSV. Tamaño máximo: {maxSizeMb} MB.
      </p>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
