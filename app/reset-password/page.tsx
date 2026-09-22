import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RetroWindow } from "@/components/retro/title-bar";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <RetroWindow
        title="Nueva contraseña"
        icon={<KeyRound className="h-3.5 w-3.5" />}
        className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-500"
      >
        <CardHeader className="items-center text-center">
          <CardTitle className="mt-2">Nueva contraseña</CardTitle>
          <CardDescription>
            Elige una nueva contraseña para tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </RetroWindow>
    </div>
  );
}
