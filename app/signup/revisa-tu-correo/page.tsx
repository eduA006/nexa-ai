import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RetroWindow } from "@/components/retro/title-bar";

export const metadata: Metadata = { title: "Revisa tu correo" };

export default function CheckEmailPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <RetroWindow
        title="Revisa tu correo"
        icon={<MailCheck className="h-3.5 w-3.5" />}
        className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-500"
      >
        <CardHeader className="items-center text-center">
          <CardTitle className="mt-2">Revisa tu correo</CardTitle>
          <CardDescription>
            Te enviamos un enlace de confirmación. Ábrelo para activar tu
            cuenta y poder iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link
            href="/login"
            className={buttonVariants({
              variant: "outline",
              className: "transition-transform hover:-translate-y-0.5",
            })}
          >
            Ir a inicio de sesión
          </Link>
        </CardContent>
      </RetroWindow>
    </div>
  );
}
