import Link from "next/link";
import { Sparkles } from "lucide-react";
import { NavLinks } from "@/components/dashboard/nav-links";
import { UserMenu } from "@/components/dashboard/user-menu";
import type { Profile } from "@/lib/dal";

export function Sidebar({
  email,
  profile,
}: {
  email: string;
  profile: Profile | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4 font-semibold tracking-tight">
        <Sparkles className="h-5 w-5" />
        <Link href="/dashboard">NEXA AI</Link>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        <NavLinks />
      </div>
      <UserMenu email={email} profile={profile} />
    </div>
  );
}
