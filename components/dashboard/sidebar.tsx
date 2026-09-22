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
    <div className="flex h-full flex-col bg-secondary">
      <div className="win98-well m-1.5 mb-1 flex items-center gap-2 bg-input px-2 py-1.5 text-sm font-bold">
        <Sparkles className="h-4 w-4" />
        <Link href="/dashboard">NEXA AI</Link>
      </div>
      <div className="flex-1 overflow-y-auto px-1.5">
        <NavLinks />
      </div>
      <UserMenu email={email} profile={profile} />
    </div>
  );
}
