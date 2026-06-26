import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock both hooks the component depends on
vi.mock("@/hooks/usePullRequests", () => ({
  usePullRequestList: vi.fn(),
}));

vi.mock("@/hooks/useMetrics", () => ({
  useTeamId: vi.fn(),
  useMetrics: vi.fn(),
}));

import PRList from "@/components/dashboard/pr-list";
import { usePullRequestList } from "@/hooks/usePullRequests";
import { useTeamId } from "@/hooks/useMetrics";
import type { PullRequest } from "@/types/database";

function renderWithQuery(component: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
}

// Helper to create a mock PR
function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    id: crypto.randomUUID(),
    repository_id: "repo-1",
    team_id: "team-1",
    github_pr_id: Math.floor(Math.random() * 1000),
    number: 42,
    title: "Fix: resolve login bug",
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

describe("PRList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: team ID is available
    vi.mocked(useTeamId).mockReturnValue({
      data: "team-1",
      isLoading: false,
      error: null,
    } as any);
  });

  it("shows skeleton while loading", () => {
    vi.mocked(usePullRequestList).mockReturnValue({
      prs: [],
      totalCount: 0,
      totalPages: 0,
      isLoading: true,
      error: null,
    });

    const { container } = renderWithQuery(<PRList />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no PRs exist", () => {
    vi.mocked(usePullRequestList).mockReturnValue({
      prs: [],
      totalCount: 0,
      totalPages: 0,
      isLoading: false,
      error: null,
    });

    renderWithQuery(<PRList />);

    expect(screen.getByText(/No pull requests found/i)).toBeInTheDocument();
  });

  it("renders PR titles in the list", () => {
    const prs = [
      makePR({ title: "feat: add dark mode" }),
      makePR({ title: "fix: resolve memory leak" }),
    ];

    vi.mocked(usePullRequestList).mockReturnValue({
      prs,
      totalCount: 2,
      totalPages: 1,
      isLoading: false,
      error: null,
    });

    renderWithQuery(<PRList />);

    expect(screen.getByText("feat: add dark mode")).toBeInTheDocument();
    expect(screen.getByText("fix: resolve memory leak")).toBeInTheDocument();
  });

  it("renders status badges for each PR", () => {
    const prs = [
      makePR({ title: "PR 1", status: "open" }),
      makePR({ title: "PR 2", status: "merged" }),
    ];

    vi.mocked(usePullRequestList).mockReturnValue({
      prs,
      totalCount: 2,
      totalPages: 1,
      isLoading: false,
      error: null,
    });

    renderWithQuery(<PRList />);

    const openElements = screen.getAllByText("Open");
    expect(openElements.length).toBeGreaterThanOrEqual(1);

    const mergedElements = screen.getAllByText("Merged");
    expect(mergedElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error message when fetch fails", () => {
    vi.mocked(usePullRequestList).mockReturnValue({
      prs: [],
      totalCount: 0,
      totalPages: 0,
      isLoading: false,
      error: new Error("Database error"),
    });

    renderWithQuery(<PRList />);

    expect(
      screen.getByText(/Failed to load pull requests/i),
    ).toBeInTheDocument();
  });
});
