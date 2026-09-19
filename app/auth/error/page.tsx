import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="w-full max-w-sm">
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
      </Card>
    </div>
  );
}
