"use client";

import { useActionState } from "react";
import { updateFullName, type ProfileActionState } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NameForm({ defaultValue }: { defaultValue: string }) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(
    updateFullName,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaultValue}
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-muted-foreground">Guardado.</p>
      )}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
