import { describe, it, expect } from "vitest";
import {
  getPRStatusColor,
  getPRStatusLabel,
  calculateAverageReviewTime,
  calculateDashboardMetrics,
} from "@/lib/utils/pr-helpers";
import type { PullRequest } from "@/types/database";

// Helper: creates a minimal PullRequest object for testing
// We only fill in the fields each test actually needs
function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    id: "test-id",
    repository_id: "repo-id",
    team_id: "team-id",
    github_pr_id: 1,
    number: 1,
    title: "Test PR",
    author_username: "testuser",
    author_avatar_url: null,
    status: "open",
    github_created_at: "2024-01-15T10:00:00Z",
    github_merged_at: null,
    github_closed_at: null,
    review_time_hours: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

describe("getPRStatusColor", () => {
  it("returns blue colors for open status", () => {
    const colors = getPRStatusColor("open");
    expect(colors.bg).toBe("bg-blue-50");
    expect(colors.text).toBe("text-blue-700");
  });

  it("returns purple colors for merged status", () => {
    const colors = getPRStatusColor("merged");
    expect(colors.bg).toBe("bg-purple-50");
    expect(colors.text).toBe("text-purple-700");
  });

  it("returns yellow colors for in_review status", () => {
    const colors = getPRStatusColor("in_review");
    expect(colors.bg).toBe("bg-yellow-50");
    expect(colors.text).toBe("text-yellow-700");
  });

  it("returns gray colors for closed status", () => {
    const colors = getPRStatusColor("closed");
    expect(colors.bg).toBe("bg-gray-50");
  });
});

describe("getPRStatusLabel", () => {
  it("returns correct labels for each status", () => {
    expect(getPRStatusLabel("open")).toBe("Open");
    expect(getPRStatusLabel("in_review")).toBe("In Review");
    expect(getPRStatusLabel("approved")).toBe("Approved");
    expect(getPRStatusLabel("merged")).toBe("Merged");
    expect(getPRStatusLabel("closed")).toBe("Closed");
  });
});

describe("calculateAverageReviewTime", () => {
  it("returns 0 for an empty array", () => {
    expect(calculateAverageReviewTime([])).toBe(0);
  });

  it("returns 0 when no PRs have review times", () => {
    const prs = [makePR({ review_time_hours: null })];
    expect(calculateAverageReviewTime(prs)).toBe(0);
  });

  it("calculates average correctly", () => {
    const prs = [
      makePR({ review_time_hours: 10 }),
      makePR({ review_time_hours: 20 }),
    ];
    expect(calculateAverageReviewTime(prs)).toBe(15);
  });

  it("ignores PRs with null review_time_hours", () => {
    const prs = [
      makePR({ review_time_hours: 10 }),
      makePR({ review_time_hours: null }), // ignored
      makePR({ review_time_hours: 20 }),
    ];
    // Average of 10 and 20 only = 15
    expect(calculateAverageReviewTime(prs)).toBe(15);
  });
});

describe("calculateDashboardMetrics", () => {
  it("returns all zeros for empty array", () => {
    const metrics = calculateDashboardMetrics([]);
    expect(metrics.totalPRs).toBe(0);
    expect(metrics.openPRs).toBe(0);
    expect(metrics.avgReviewTimeHours).toBe(0);
    expect(metrics.weeklyVelocity).toBe(0);
  });

  it("counts total PRs correctly", () => {
    const prs = [makePR(), makePR(), makePR()];
    const metrics = calculateDashboardMetrics(prs);
    expect(metrics.totalPRs).toBe(3);
  });

  it("counts only open PRs for openPRs metric", () => {
    const prs = [
      makePR({ status: "open" }),
      makePR({ status: "open" }),
      makePR({ status: "merged" }),
      makePR({ status: "closed" }),
    ];
    const metrics = calculateDashboardMetrics(prs);
    expect(metrics.openPRs).toBe(2);
  });
});
