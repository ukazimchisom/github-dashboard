// Temporary placeholder — we'll replace this with real dashboard content
// in the next few steps

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Good to have you back 👋
          </h2>
          <p className="text-gray-500 mt-1">
            Your dashboard is ready. Sync your GitHub data to get started.
          </p>
        </div>
      </div>

      {/* Placeholder cards to verify layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {["Total PRs", "Open PRs", "Avg Review Time", "Weekly Velocity"].map(
          (label) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">—</p>
            </div>
          ),
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">
          Chart and PR list will appear here after syncing GitHub data
        </p>
      </div>
    </div>
  );
}
