import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";
import { Button } from "@/components/ui/button";

/**
 * Dashboard mínimo para verificar el flujo de autenticación (Fase 2).
 * El dashboard completo (herramientas recomendadas, documentos recientes,
 * actividad) se construye en la Fase 3.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Hola, {user.user_metadata.full_name ?? user.email} 👋
      </h1>
      <p className="text-muted-foreground">
        Sesión iniciada correctamente. El dashboard completo se construye en
        la Fase 3.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
