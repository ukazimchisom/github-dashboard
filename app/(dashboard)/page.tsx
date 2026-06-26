import MetricsCards from "@/components/dashboard/metrics-cards";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Your team&apos;s pull request activity at a glance
        </p>
      </div>

      {/* Metric cards row */}
      <MetricsCards />

      {/* Placeholder for chart — next step */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">
          PR chart coming in the next step
        </p>
      </div>

      {/* Placeholder for PR list — coming soon */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">PR list coming soon</p>
      </div>
    </div>
  );
}
