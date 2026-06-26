import MetricsCards from "@/components/dashboard/metrics-cards";
import PRChart from "@/components/dashboard/pr-chart";
import PRList from "@/components/dashboard/pr-list";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
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

      {/* PR list table */}
      <PRList />
    </div>
  );
}
