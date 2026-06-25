import {
  formatDistanceToNow,
  format,
  differenceInHours,
  parseISO,
} from "date-fns";

// ============================================
// formatRelativeTime
// ============================================
// Converts an ISO date string into a human-readable relative time.
// Used in the PR list to show "3 days ago" instead of a raw timestamp.
//
// Example:
//   formatRelativeTime('2024-01-15T10:00:00Z') → "3 days ago"
//   formatRelativeTime('2024-01-15T09:55:00Z') → "5 minutes ago"

export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "Unknown date";
  }
}

// ============================================
// formatDate
// ============================================
// Formats an ISO date string into a readable date.
// Used for displaying PR creation dates in the table.
//
// Example:
//   formatDate('2024-01-15T10:00:00Z') → "Jan 15, 2024"

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy");
  } catch {
    return "Invalid date";
  }
}

// ============================================
// formatDateShort
// ============================================
// Shorter date format for chart axis labels.
//
// Example:
//   formatDateShort('2024-01-15T10:00:00Z') → "Jan 15"

export function formatDateShort(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d");
  } catch {
    return "";
  }
}

// ============================================
// calculateReviewTimeHours
// ============================================
// Calculates how many hours a PR was open before being merged.
// Returns null if the PR hasn't been merged yet.
//
// Example:
//   calculateReviewTimeHours('2024-01-15T10:00:00Z', '2024-01-16T14:00:00Z') → 28
//   calculateReviewTimeHours('2024-01-15T10:00:00Z', null) → null

export function calculateReviewTimeHours(
  createdAt: string,
  mergedAt: string | null,
): number | null {
  if (!mergedAt) return null;

  try {
    const created = parseISO(createdAt);
    const merged = parseISO(mergedAt);
    const hours = differenceInHours(merged, created);

    // Return 0 minimum — negative values mean bad data
    return Math.max(0, hours);
  } catch {
    return null;
  }
}

// ============================================
// formatReviewTime
// ============================================
// Converts review time hours into a human-readable string.
// Used in metric cards and PR list.
//
// Example:
//   formatReviewTime(2)  → "2h"
//   formatReviewTime(25) → "1d 1h"
//   formatReviewTime(null) → "—"

export function formatReviewTime(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return "< 1h";

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days === 0) return `${remainingHours}h`;
  if (remainingHours === 0) return `${days}d`;
  return `${days}d ${remainingHours}h`;
}

// ============================================
// getWeekLabel
// ============================================
// Returns a short label for a given date's week.
// Used as axis labels on our PR chart.
//
// Example:
//   getWeekLabel('2024-01-15T10:00:00Z') → "Jan 15"

export function getWeekLabel(dateString: string): string {
  return formatDateShort(dateString);
}
