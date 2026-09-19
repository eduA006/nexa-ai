import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Sparkles className="h-6 w-6" />
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
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Inicia sesión
            </Link>
          </p>
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Volver al inicio
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
