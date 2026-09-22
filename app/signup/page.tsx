import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RetroWindow } from "@/components/retro/title-bar";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <RetroWindow
        title="Crear cuenta"
        icon={<Sparkles className="h-3.5 w-3.5" />}
        className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-500"
      >
        <CardHeader className="items-center text-center">
          <CardTitle className="mt-2">Crear cuenta</CardTitle>
          <CardDescription>
            Regístrate con tu correo para empezar a usar NEXA AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground">
              Inicia sesión
            </Link>
          </p>
          <Link
            href="/"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "transition-transform hover:-translate-y-0.5",
            })}
          >
            Volver al inicio
          </Link>
        </CardFooter>
      </RetroWindow>
    </div>
  );
}
