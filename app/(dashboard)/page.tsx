"use client";

import MetricsCards from "@/components/dashboard/metrics-cards";
import PRChart from "@/components/dashboard/pr-chart";
import PRList from "@/components/dashboard/pr-list";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function DashboardPage() {
  // Subscribe to real-time database changes
  // Dashboard auto-refreshes when webhooks update PRs
  useRealtimeSync();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-500">
          Overview
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          Your team&apos;s pull request activity at a glance
        </p>
      </div>

      <MetricsCards />
      <PRChart />
      <PRList />
    </div>
  );
}
