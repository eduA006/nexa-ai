import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NameForm } from "@/components/profile/name-form";

const ROLE_LABEL: Record<string, string> = {
  student: "Estudiante",
  professional: "Profesional",
};

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  const { user, profile } = session;

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">
          Información de tu cuenta en NEXA AI.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Datos de la cuenta</CardTitle>
          <CardDescription>
            {user.email} ·{" "}
            <Badge variant="secondary">
              {profile?.role ? ROLE_LABEL[profile.role] : "Sin perfil"}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NameForm defaultValue={profile?.full_name ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
