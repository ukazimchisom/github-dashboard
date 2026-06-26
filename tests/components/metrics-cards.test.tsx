import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the useMetrics hook so tests don't need a real database
vi.mock("@/hooks/useMetrics", () => ({
  useMetrics: vi.fn(),
}));

import MetricsCards from "@/components/dashboard/metrics-cards";
import { useMetrics } from "@/hooks/useMetrics";

// Helper: wraps a component in a fresh QueryClient for testing
function renderWithQuery(component: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
}

describe("MetricsCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows skeleton loaders while data is loading", () => {
    // Mock the hook to return loading state
    vi.mocked(useMetrics).mockReturnValue({
      metrics: null,
      chartData: [],
      isLoading: true,
      error: null,
    });

    const { container } = renderWithQuery(<MetricsCards />);

    // Skeletons have the animate-pulse class
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no data has been synced", () => {
    vi.mocked(useMetrics).mockReturnValue({
      metrics: {
        totalPRs: 0,
        openPRs: 0,
        avgReviewTimeHours: 0,
        weeklyVelocity: 0,
      },
      chartData: [],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<MetricsCards />);

    expect(screen.getAllByText("Sync GitHub data to see metrics")).toHaveLength(
      4,
    );
  });

  it("displays real metrics when data is available", () => {
    vi.mocked(useMetrics).mockReturnValue({
      metrics: {
        totalPRs: 42,
        openPRs: 7,
        avgReviewTimeHours: 24,
        weeklyVelocity: 12,
      },
      chartData: [],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<MetricsCards />);

    // Check metric values appear on screen
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows error message when data fetch fails", () => {
    vi.mocked(useMetrics).mockReturnValue({
      metrics: null,
      chartData: [],
      isLoading: false,
      error: new Error("Failed to fetch pull requests"),
    });

    renderWithQuery(<MetricsCards />);

    expect(screen.getByText(/Failed to load metrics/i)).toBeInTheDocument();
  });

  it("renders all four metric card titles", () => {
    vi.mocked(useMetrics).mockReturnValue({
      metrics: {
        totalPRs: 10,
        openPRs: 3,
        avgReviewTimeHours: 12,
        weeklyVelocity: 5,
      },
      chartData: [],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<MetricsCards />);

    expect(screen.getByText("Total PRs")).toBeInTheDocument();
    expect(screen.getByText("Open PRs")).toBeInTheDocument();
    expect(screen.getByText("Avg Review Time")).toBeInTheDocument();
    expect(screen.getByText("Weekly Velocity")).toBeInTheDocument();
  });
});
