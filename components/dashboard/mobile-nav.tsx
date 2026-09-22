"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "@/components/dashboard/nav-links";
import { UserMenu } from "@/components/dashboard/user-menu";
import { TitleBar } from "@/components/retro/title-bar";
import type { Profile } from "@/lib/dal";

export function MobileNav({
  email,
  profile,
}: {
  email: string;
  profile: Profile | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="win98-titlebar flex items-center justify-between py-1 pr-1 pl-2 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold">
        <Sparkles className="h-4 w-4" />
        NEXA AI
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="secondary" size="icon-sm" aria-label="Abrir menú" />}
        >
          <Menu className="h-4 w-4" />
        </SheetTrigger>
        <SheetContent side="left" className="win98-panel flex w-64 flex-col gap-0 border-none bg-secondary p-0 shadow-none">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <TitleBar title="NEXA AI" icon={<Sparkles className="h-3.5 w-3.5" />} />
          <div className="flex-1 overflow-y-auto px-1.5 py-1">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <UserMenu email={email} profile={profile} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
