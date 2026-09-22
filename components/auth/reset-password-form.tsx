"use client";

import { useActionState } from "react";
import { updatePassword, type AuthActionState } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    updatePassword,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div
        className="flex flex-col gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "50ms", animationFillMode: "backwards" }}
      >
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-500 transition-transform active:scale-[0.98]"
        style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
      >
        {pending ? "Guardando…" : "Guardar nueva contraseña"}
      </Button>
    </form>
  );
}
