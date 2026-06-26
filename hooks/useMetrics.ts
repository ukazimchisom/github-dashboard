"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TABLES, QUERY_STALE_TIME } from "@/config/constants";
import {
  calculateDashboardMetrics,
  buildChartData,
} from "@/lib/utils/pr-helpers";
import type { PullRequest } from "@/types/database";
import type { DashboardMetrics, PRChartDataPoint } from "@/types/dashboard";

// ============================================
// fetchPullRequests
// ============================================
// Fetches all pull requests for a given team from Supabase.
// This is the raw data fetch — calculation happens separately.

async function fetchPullRequests(teamId: string): Promise<PullRequest[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from(TABLES.PULL_REQUESTS)
    .select("*")
    .eq("team_id", teamId)
    .order("github_created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch pull requests: ${error.message}`);
  }

  return data ?? [];
}

// ============================================
// fetchUserTeam
// ============================================
// Gets the current user's team ID.
// Every data query depends on this.

async function fetchUserTeam(): Promise<string | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: team } = await supabase
    .from(TABLES.TEAMS)
    .select("id")
    .eq("manager_id", user.id)
    .single();

  return team?.id ?? null;
}

// ============================================
// useTeamId
// ============================================
// Hook that returns the current user's team ID.
// Used as a dependency for other queries.

export function useTeamId() {
  return useQuery({
    queryKey: ["team-id"],
    queryFn: fetchUserTeam,
    staleTime: QUERY_STALE_TIME,
  });
}

// ============================================
// usePullRequests
// ============================================
// Hook that returns all pull requests for the user's team.
// Other hooks derive their data from this one.

export function usePullRequests() {
  const { data: teamId } = useTeamId();

  return useQuery({
    queryKey: ["pull-requests", teamId],
    queryFn: () => fetchPullRequests(teamId!),
    // Only run this query when we have a teamId
    enabled: !!teamId,
    staleTime: QUERY_STALE_TIME,
  });
}

// ============================================
// useMetrics
// ============================================
// Derives the four dashboard metric values from pull request data.
// Returns metrics, chart data, loading state, and error state.

export function useMetrics(): {
  metrics: DashboardMetrics | null;
  chartData: PRChartDataPoint[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: prs, isLoading, error } = usePullRequests();

  if (!prs) {
    return {
      metrics: null,
      chartData: [],
      isLoading,
      error: error as Error | null,
    };
  }

  return {
    metrics: calculateDashboardMetrics(prs),
    chartData: buildChartData(prs),
    isLoading,
    error: error as Error | null,
  };
}
