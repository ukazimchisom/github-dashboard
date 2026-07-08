"use client";

import { useMetrics } from "@/hooks/useMetrics";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatReviewTime } from "@/lib/utils/date-helpers";
import { ArrowUpDown, Clock, TrendingUp } from "lucide-react";

// ============================================
// MetricCardSkeleton
// ============================================
// Shown while data is loading.
// Matches the shape of a real metric card.

function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

// ============================================
// MetricCard
// ============================================
// A single metric card showing a title, value, and description.

type MetricCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  valueColor?: string;
};

function MetricCard({
  title,
  value,
  description,
  icon,
  valueColor = "text-gray-900 dark:text-gray-100",
}: MetricCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <CardTitle>{title}</CardTitle>
          {/* Icon container */}
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
            {icon}
          </div>
        </div>

        {/* The main metric value */}
        <p className={`text-2xl font-bold ${valueColor} mb-1`}>{value}</p>

        {/* Supporting description */}
        <p className="text-xs text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}

// ============================================
// MetricsCards
// ============================================
// The full row of four metric cards.
// Handles loading, error, and empty states.

export default function MetricsCards() {
  const { metrics, isLoading, error } = useMetrics();

  // Show skeletons while loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load metrics: {error.message}
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if no data yet
  if (!metrics || metrics.totalPRs === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {["Total PRs", "Open PRs", "Avg Review Time", "Weekly Velocity"].map(
          (label) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <CardTitle className="mb-3">{label}</CardTitle>
                <p className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                  —
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Sync GitHub data to see metrics
                </p>
              </CardContent>
            </Card>
          ),
        )}
      </div>
    );
  }

  // Real data — build the four cards
  const cards: MetricCardProps[] = [
    {
      title: "Total PRs",
      value: metrics.totalPRs.toLocaleString(),
      description: "All pull requests synced",
      valueColor: "text-gray-900 dark:text-gray-100",
      icon: <ArrowUpDown className="w-4 h-4 text-blue-600" />,
    },
    {
      title: "Open PRs",
      value: metrics.openPRs.toLocaleString(),
      description: "Currently awaiting review",
      valueColor:
        metrics.openPRs > 10
          ? "text-yellow-600 dark:text-yellow-400"
          : "text-gray-900 dark:text-gray-100",
      icon: <Clock className="w-4 h-4 text-red-600" strokeWidth={1.5} />,
    },
    {
      title: "Avg Review Time",
      value: formatReviewTime(metrics.avgReviewTimeHours),
      description: "Average time to merge",
      valueColor:
        metrics.avgReviewTimeHours > 48
          ? "text-red-600 dark:text-red-400"
          : metrics.avgReviewTimeHours > 24
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-green-600 dark:text-green-400",
      icon: <Clock className="w-4 h-4 text-red-600" strokeWidth={1.5} />,
    },
    {
      title: "Weekly Velocity",
      value: metrics.weeklyVelocity.toLocaleString(),
      description: "PRs merged in last 7 days",
      valueColor: "text-gray-900 dark:text-gray-100",
      icon: (
        <TrendingUp className="w-4 h-4 text-purple-600" strokeWidth={1.5} />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} />
      ))}
    </div>
  );
}
