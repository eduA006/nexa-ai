import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/supabase/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo, error } = await searchParams;

  async function handleSignIn() {
    "use server";
    await signInWithGoogle(redirectTo);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Sparkles className="h-6 w-6" />
          <CardTitle className="mt-2">Inicio de sesión</CardTitle>
          <CardDescription>
            Inicia sesión con tu cuenta de Google para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <p className="text-sm text-destructive">
              No se pudo iniciar sesión. Inténtalo nuevamente.
            </p>
          )}
          <form action={handleSignIn} className="w-full">
            <Button type="submit" className="w-full">
              Continuar con Google
            </Button>
          </form>
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
