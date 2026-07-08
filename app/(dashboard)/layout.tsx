import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import SyncButton from "@/components/shared/sync-button";
import TeamSelector from "@/components/shared/team-selector";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Dashboard
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Monitor your team&apos;s pull request activity
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TeamSelector />
              <SyncButton />
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
