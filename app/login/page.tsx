import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Sparkles className="h-6 w-6" />
          <CardTitle className="mt-2">Inicio de sesión</CardTitle>
          <CardDescription>
            El inicio de sesión con Google todavía no está disponible. Se
            habilitará en una fase posterior del desarrollo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button disabled className="w-full">
            Continuar con Google (próximamente)
          </Button>
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Volver al inicio
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
