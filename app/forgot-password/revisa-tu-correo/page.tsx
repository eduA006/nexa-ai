import Link from "next/link";
import { MailCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CheckEmailForResetPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader className="items-center text-center">
          <MailCheck className="h-6 w-6 animate-in zoom-in-50 duration-700" />
          <CardTitle className="mt-2">Revisa tu correo</CardTitle>
          <CardDescription>
            Si existe una cuenta con ese correo, te enviamos un enlace para
            restablecer tu contraseña.
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
      </Card>
    </div>
  );
}
