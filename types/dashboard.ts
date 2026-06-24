export type MetricCard = {
  title: string;
  value: number | string;
  description: string;
  trend?: {
    value: number; // e.g. 12 (meaning +12%)
    isPositive: boolean;
  };
};

export type PRChartDataPoint = {
  week: string; // e.g. "Jun 9"
  opened: number;
  merged: number;
};

export type DashboardMetrics = {
  totalPRs: number;
  openPRs: number;
  avgReviewTimeHours: number;
  weeklyVelocity: number;
};
