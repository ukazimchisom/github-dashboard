import { PR_STATUS, type PR_STATUS_TYPE } from "@/config/constants";
import type { PullRequest } from "@/types/database";
import type { DashboardMetrics, PRChartDataPoint } from "@/types/dashboard";

// ============================================
// getPRStatusColor
// ============================================
// Maps a PR status to Tailwind CSS classes for the badge.
// Used in the PR list table to color-code statuses.
//
// Example:
//   getPRStatusColor('open')    → { bg: 'bg-blue-50', text: 'text-blue-700', ... }
//   getPRStatusColor('merged')  → { bg: 'bg-purple-50', text: 'text-purple-700', ... }

export function getPRStatusColor(status: PR_STATUS_TYPE): {
  bg: string;
  text: string;
  dot: string;
} {
  const colorMap: Record<
    PR_STATUS_TYPE,
    { bg: string; text: string; dot: string }
  > = {
    [PR_STATUS.OPEN]: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
    [PR_STATUS.IN_REVIEW]: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      dot: "bg-yellow-500",
    },
    [PR_STATUS.APPROVED]: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    [PR_STATUS.MERGED]: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    [PR_STATUS.CLOSED]: {
      bg: "bg-gray-50",
      text: "text-gray-600",
      dot: "bg-gray-400",
    },
  };

  return colorMap[status] ?? colorMap[PR_STATUS.OPEN];
}

// ============================================
// getPRStatusLabel
// ============================================
// Converts a raw status value into a display label.
//
// Example:
//   getPRStatusLabel('in_review') → "In Review"
//   getPRStatusLabel('merged')    → "Merged"

export function getPRStatusLabel(status: PR_STATUS_TYPE): string {
  const labelMap: Record<PR_STATUS_TYPE, string> = {
    [PR_STATUS.OPEN]: "Open",
    [PR_STATUS.IN_REVIEW]: "In Review",
    [PR_STATUS.APPROVED]: "Approved",
    [PR_STATUS.MERGED]: "Merged",
    [PR_STATUS.CLOSED]: "Closed",
  };

  return labelMap[status] ?? "Unknown";
}

// ============================================
// calculateAverageReviewTime
// ============================================
// Calculates the average review time in hours across merged PRs.
// Ignores PRs that haven't been merged (no review_time_hours).
//
// Example:
//   calculateAverageReviewTime([
//     { review_time_hours: 10, ... },
//     { review_time_hours: 20, ... },
//     { review_time_hours: null, ... },  ← ignored
//   ]) → 15

export function calculateAverageReviewTime(prs: PullRequest[]): number {
  // Only include merged PRs that have a review time
  const mergedPRs = prs.filter(
    (pr) => pr.review_time_hours !== null && pr.review_time_hours !== undefined,
  );

  if (mergedPRs.length === 0) return 0;

  const totalHours = mergedPRs.reduce(
    (sum, pr) => sum + (pr.review_time_hours ?? 0),
    0,
  );

  // Round to 1 decimal place
  return Math.round((totalHours / mergedPRs.length) * 10) / 10;
}

// ============================================
// calculateWeeklyVelocity
// ============================================
// Counts how many PRs were merged in the current week (last 7 days).
// Used in the "Team Velocity" metric card.
//
// Example:
//   calculateWeeklyVelocity(prs) → 12

export function calculateWeeklyVelocity(prs: PullRequest[]): number {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return prs.filter((pr) => {
    if (!pr.github_merged_at) return false;
    const mergedAt = new Date(pr.github_merged_at);
    return mergedAt >= sevenDaysAgo;
  }).length;
}

// ============================================
// calculateDashboardMetrics
// ============================================
// Derives all four metric card values from a list of PRs.
// Single function so all metrics are calculated consistently.

export function calculateDashboardMetrics(
  prs: PullRequest[],
): DashboardMetrics {
  return {
    totalPRs: prs.length,
    openPRs: prs.filter((pr) => pr.status === PR_STATUS.OPEN).length,
    avgReviewTimeHours: calculateAverageReviewTime(prs),
    weeklyVelocity: calculateWeeklyVelocity(prs),
  };
}

// ============================================
// buildChartData
// ============================================
// Groups PRs by week and counts opened vs merged for each week.
// Returns data in the format Recharts expects.
//
// Example output:
//   [
//     { week: 'Jan 1', opened: 5, merged: 3 },
//     { week: 'Jan 8', opened: 8, merged: 6 },
//   ]

export function buildChartData(
  prs: PullRequest[],
  weeks: number = 8,
): PRChartDataPoint[] {
  const result: PRChartDataPoint[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    // Calculate start and end of each week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7 - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);

    // Count PRs opened this week
    const opened = prs.filter((pr) => {
      const created = new Date(pr.github_created_at);
      return created >= weekStart && created <= weekEnd;
    }).length;

    // Count PRs merged this week
    const merged = prs.filter((pr) => {
      if (!pr.github_merged_at) return false;
      const mergedDate = new Date(pr.github_merged_at);
      return mergedDate >= weekStart && mergedDate <= weekEnd;
    }).length;

    // Format week label as "Jan 15"
    const weekLabel = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    result.push({ week: weekLabel, opened, merged });
  }

  return result;
}
