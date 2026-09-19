"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "@/components/dashboard/nav-links";
import { UserMenu } from "@/components/dashboard/user-menu";
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
    <div className="flex items-center justify-between border-b px-4 py-3 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
        <Sparkles className="h-5 w-5" />
        NEXA AI
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Abrir menú" />}
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="flex w-64 flex-col p-0">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <div className="px-4 py-4 font-semibold tracking-tight">NEXA AI</div>
          <div className="flex-1 overflow-y-auto px-2">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <UserMenu email={email} profile={profile} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
