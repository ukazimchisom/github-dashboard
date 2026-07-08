"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TABLES, QUERY_STALE_TIME } from "@/config/constants";
import {
  calculateDashboardMetrics,
  buildChartData,
} from "@/lib/utils/pr-helpers";
import { useTeamStore } from "@/store/teamStore";
import type { PullRequest } from "@/types/database";
import type { DashboardMetrics, PRChartDataPoint } from "@/types/dashboard";

// ============================================
// fetchPullRequests
// ============================================

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
// useTeamId
// ============================================
// Now reads from Zustand store instead of the database.
// The store is populated by the TeamSelector component.

export function useTeamId() {
  const selectedTeamId = useTeamStore((state) => state.selectedTeamId);
  return { data: selectedTeamId };
}

// ============================================
// usePullRequests
// ============================================

export function usePullRequests() {
  const selectedTeamId = useTeamStore((state) => state.selectedTeamId);

  return useQuery({
    queryKey: ["pull-requests", selectedTeamId],
    queryFn: () => fetchPullRequests(selectedTeamId!),
    enabled: !!selectedTeamId,
    staleTime: QUERY_STALE_TIME,

    // Poll every 30 seconds to pick up webhook-triggered updates
    // This is lightweight — TanStack Query only refetches if the
    // window is focused and the data is stale
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

// ============================================
// useMetrics
// ============================================

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
