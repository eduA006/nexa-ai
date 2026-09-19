"use client";

import { GraduationCap, Briefcase } from "lucide-react";
import { setRole } from "@/lib/profile/actions";
import { cn } from "@/lib/utils";

export function RoleForm({ currentRole }: { currentRole: string | null }) {
  const setRoleFromSettings = setRole.bind(null, "/settings");

  const options = [
    { value: "student", label: "Estudiante", icon: GraduationCap },
    { value: "professional", label: "Profesional", icon: Briefcase },
  ] as const;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {options.map((option) => (
        <form key={option.value} action={setRoleFromSettings}>
          <input type="hidden" name="role" value={option.value} />
          <button
            type="submit"
            disabled={currentRole === option.value}
            className={cn(
              "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
              currentRole === option.value
                ? "border-foreground bg-muted"
                : "hover:bg-muted",
            )}
          >
            <option.icon className="h-4 w-4" />
            {option.label}
            {currentRole === option.value && (
              <span className="text-xs text-muted-foreground">(actual)</span>
            )}
          </button>
        </form>
      ))}
    </div>
  );
}
