// ============================================
// App Configuration
// ============================================

// The base URL of our app.
// In development: http://localhost:3000
// In production: https://your-app.vercel.app
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ============================================
// GitHub API Configuration
// ============================================

// GitHub REST API base URL — we'll use this when making direct fetch calls
export const GITHUB_API_URL = "https://api.github.com";

// Maximum PRs to fetch per repository per sync
// GitHub API returns max 100 per page — we start conservative
export const GITHUB_PR_FETCH_LIMIT = 100;

// How many weeks of history to show on the PR chart
export const CHART_WEEKS = 8;

// ============================================
// Pull Request Status Labels
// ============================================

// These map GitHub's raw PR states to our display labels
// GitHub only has "open" and "closed" — we add more granularity
export const PR_STATUS = {
  OPEN: "open",
  IN_REVIEW: "in_review",
  APPROVED: "approved",
  MERGED: "merged",
  CLOSED: "closed",
} as const;

// TypeScript trick: this creates a type from the values above
// PR_STATUS_TYPE will be: "open" | "in_review" | "approved" | "merged" | "closed"
export type PR_STATUS_TYPE = (typeof PR_STATUS)[keyof typeof PR_STATUS];

// ============================================
// UI Configuration
// ============================================

// How many PRs to show per page in the PR list table
export const PR_PAGE_SIZE = 20;

// How long (in milliseconds) before a TanStack Query re-fetches stale data
// 5 minutes = 5 * 60 * 1000
export const QUERY_STALE_TIME = 5 * 60 * 1000;

// ============================================
// Supabase Table Names
// ============================================

// Centralizing table names prevents typos scattered across queries
export const TABLES = {
  TEAMS: "teams",
  TEAM_MEMBERS: "team_members",
  REPOSITORIES: "repositories",
  PULL_REQUESTS: "pull_requests",
} as const;
