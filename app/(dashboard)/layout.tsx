// Dashboard layout wraps all dashboard pages.
// It adds the sidebar and the main content area.
// This is a Server Component — no 'use client' needed.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import SyncButton from "@/components/shared/sync-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double-check authentication server-side
  // Middleware handles redirects, but this is a safety net
  // Never trust only client-side auth checks
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    // ToastProvider wraps everything so any component can show toasts
    <ToastProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar — fixed on the left */}
        <Sidebar />

        {/* Main content area — scrollable */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top header bar */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-400">
                Monitor your team&apos;s pull request activity
              </p>
            </div>

            {/* Sync button in the top-right of the header */}
            <SyncButton />
          </header>

          {/* Page content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
