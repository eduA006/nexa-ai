import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";

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
    <div className="flex min-h-svh flex-1 flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r md:flex">
        <Sidebar email={user.email ?? ""} profile={profile} />
      </aside>
      <div className="flex flex-1 flex-col">
        <MobileNav email={user.email ?? ""} profile={profile} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
