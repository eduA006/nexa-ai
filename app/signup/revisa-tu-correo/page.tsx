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

export default function CheckEmailPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <MailCheck className="h-6 w-6" />
          <CardTitle className="mt-2">Revisa tu correo</CardTitle>
          <CardDescription>
            Te enviamos un enlace de confirmación. Ábrelo para activar tu
            cuenta y poder iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>
            Ir a inicio de sesión
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
