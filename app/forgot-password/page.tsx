import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RetroWindow } from "@/components/retro/title-bar";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <RetroWindow
        title="Recuperar contraseña"
        icon={<KeyRound className="h-3.5 w-3.5" />}
        className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-500"
      >
        <CardHeader className="items-center text-center">
          <CardTitle className="mt-2">Recuperar contraseña</CardTitle>
          <CardDescription>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu
            contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            ¿Recordaste tu contraseña?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </RetroWindow>
    </div>
  );
}
