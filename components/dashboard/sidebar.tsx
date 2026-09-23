import Link from "next/link";
import { Sparkles } from "lucide-react";
import { NavLinks } from "@/components/dashboard/nav-links";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import type { Profile } from "@/lib/dal";

export function Sidebar({
  email,
  profile,
}: {
  email: string;
  profile: Profile | null;
}) {
  return (
    <div className="flex h-full flex-col bg-secondary">
      <div className="win98-well m-1.5 mb-1 flex items-center justify-between gap-2 bg-input px-2 py-1.5 text-sm font-bold">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <Link href="/dashboard" className="truncate">
            NEXA AI
          </Link>
        </div>
        <ThemeModeToggle className="h-6 w-6" />
      </div>
      <div className="flex-1 overflow-y-auto px-1.5">
        <NavLinks />
      </div>
      <UserMenu email={email} profile={profile} />
    </div>
  );
}
