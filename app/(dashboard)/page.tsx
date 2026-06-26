import MetricsCards from "@/components/dashboard/metrics-cards";
import PRChart from "@/components/dashboard/pr-chart";

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

      {/* Four metric cards */}
      <MetricsCards />

      {/* PR activity chart */}
      <PRChart />

      {/* Placeholder for PR list — next step */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">PR list coming in the next step</p>
      </div>
    </div>
  );
}
