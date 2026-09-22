import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { TitleBar } from "@/components/retro/title-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (!session.profile?.role) redirect("/onboarding");

  const { user, profile } = session;

  return (
    <div className="flex min-h-svh flex-1 items-stretch justify-center bg-background p-0 md:p-3">
      <div className="win98-panel flex w-full max-w-[1400px] flex-1 flex-col bg-card md:h-[calc(100svh-1.5rem)]">
        <TitleBar title="NEXA AI — Panel" icon={<Sparkles className="h-3.5 w-3.5" />} className="hidden md:flex" />
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="hidden w-56 shrink-0 border-r border-border md:flex">
            <Sidebar email={user.email ?? ""} profile={profile} />
          </aside>
          <div className="flex min-h-0 flex-1 flex-col">
            <MobileNav email={user.email ?? ""} profile={profile} />
            <main className="win98-well flex flex-1 flex-col overflow-y-auto bg-input m-0.5 md:m-2">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
