"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TABLES, QUERY_STALE_TIME, PR_PAGE_SIZE } from "@/config/constants";
import { useTeamStore } from "@/store/teamStore";
import type { PullRequest } from "@/types/database";
import type { PR_STATUS_TYPE } from "@/config/constants";

async function fetchPullRequestsWithFilter(
  teamId: string,
  statusFilter: PR_STATUS_TYPE | "all",
): Promise<PullRequest[]> {
  const supabase = createClient();

  let query = supabase
    .from(TABLES.PULL_REQUESTS)
    .select(
      `
      *,
      repositories (
        name,
        full_name,
        owner
      )
    `,
    )
    .eq("team_id", teamId)
    .order("github_created_at", { ascending: false })
    .limit(200);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch pull requests: ${error.message}`);
  }

  return (data ?? []) as PullRequest[];
}

export function usePullRequestList(
  statusFilter: PR_STATUS_TYPE | "all" = "all",
  page: number = 1,
) {
  // Read directly from Zustand store
  const selectedTeamId = useTeamStore((state) => state.selectedTeamId);

  const {
    data: allPRs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pull-requests-list", selectedTeamId, statusFilter],
    queryFn: () => fetchPullRequestsWithFilter(selectedTeamId!, statusFilter),
    enabled: !!selectedTeamId,
    staleTime: QUERY_STALE_TIME,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const totalCount = allPRs.length;
  const totalPages = Math.ceil(totalCount / PR_PAGE_SIZE);
  const startIndex = (page - 1) * PR_PAGE_SIZE;
  const paginatedPRs = allPRs.slice(startIndex, startIndex + PR_PAGE_SIZE);

  return {
    prs: paginatedPRs,
    totalCount,
    totalPages,
    isLoading,
    error,
  };
}
