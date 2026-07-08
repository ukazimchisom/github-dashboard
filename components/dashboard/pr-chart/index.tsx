"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMetrics } from "@/hooks/useMetrics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PRChartDataPoint } from "@/types/dashboard";

// ============================================
// CustomTooltip
// ============================================
// Recharts calls this component when the user hovers over a bar.
// We customize it to match our design system.

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
};

function CustomTooltip({ active, payload, label }: TooltipProps) {
  // active is true only when hovering over a bar
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500 capitalize">{entry.name}:</span>
          <span className="font-medium text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// ChartSkeleton
// ============================================
// Shown while chart data is loading.

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-end gap-3 px-4">
          {/* Simulate bars of varying heights */}
          {[40, 70, 55, 90, 65, 80, 45, 75].map((height, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1 items-center">
              <Skeleton
                className="w-full rounded-sm"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// EmptyChart
// ============================================
// Shown when there's no data to display yet.

function EmptyChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PR Activity — Last 8 Weeks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-gray-200 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <p className="text-sm text-gray-400">
              Sync GitHub data to see chart
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// PRChart
// ============================================
// The main chart component.
// Shows bars for PRs opened vs merged per week.

export default function PRChart() {
  const { chartData, isLoading, error } = useMetrics();

  // Loading state
  if (isLoading) return <ChartSkeleton />;

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">
            Failed to load chart: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Empty state — no data synced yet
  const hasData = chartData.some(
    (point) => point.opened > 0 || point.merged > 0,
  );

  if (!hasData) return <EmptyChart />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-gray-900">
              PR Activity
            </CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">
              Opened vs merged — last 8 weeks
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Opened</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-purple-500" />
              <span>Merged</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 
          ResponsiveContainer makes the chart fill its parent width.
          height={300} sets a fixed pixel height.
          Always wrap Recharts charts in ResponsiveContainer.
        */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            barCategoryGap="30%"
            barGap={4}
          >
            {/*
              CartesianGrid draws the subtle background grid lines.
              strokeDasharray="3 3" makes them dashed.
              vertical={false} only shows horizontal lines.
            */}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--chart-grid)"
            />

            {/*
              XAxis shows the week labels at the bottom.
              dataKey tells it which field from our data to use.
            */}
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
              axisLine={false}
              tickLine={false}
            />

            {/*
              YAxis shows the numbers on the left.
              allowDecimals={false} prevents "1.5 PRs"
            */}
            <YAxis
              tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            {/* Our custom tooltip on hover */}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />

            {/* Blue bars for PRs opened */}
            <Bar
              dataKey="opened"
              name="opened"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />

            {/* Purple bars for PRs merged */}
            <Bar
              dataKey="merged"
              name="merged"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
