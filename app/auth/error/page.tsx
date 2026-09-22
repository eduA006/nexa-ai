import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RetroWindow } from "@/components/retro/title-bar";

export const metadata: Metadata = { title: "Enlace inválido" };

export default function AuthErrorPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <RetroWindow
        title="No se pudo verificar el enlace"
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-500"
      >
        <CardHeader className="items-center text-center">
          <CardTitle>No se pudo verificar el enlace</CardTitle>
          <CardDescription>
            El enlace expiró o ya fue usado. Intenta iniciar sesión
            nuevamente o solicita un nuevo enlace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/login" className={buttonVariants()}>
            Ir a inicio de sesión
          </Link>
        </CardContent>
      </RetroWindow>
    </div>
  );
}
