import { LogOut } from "lucide-react";
import { signOut } from "@/lib/supabase/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/dal";

const ROLE_LABEL: Record<string, string> = {
  student: "Estudiante",
  professional: "Profesional",
};

export function UserMenu({
  email,
  profile,
}: {
  email: string;
  profile: Profile | null;
}) {
  const displayName = profile?.full_name || email;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 border-t px-2 py-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {profile?.role ? ROLE_LABEL[profile.role] : email}
        </p>
      </div>
      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
