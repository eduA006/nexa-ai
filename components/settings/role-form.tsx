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
              "win98-btn flex items-center gap-2 px-4 py-2 text-sm font-medium",
              currentRole === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
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
