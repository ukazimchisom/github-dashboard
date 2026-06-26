"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TABLES, QUERY_STALE_TIME, PR_PAGE_SIZE } from "@/config/constants";
import type { PullRequest } from "@/types/database";
import type { PR_STATUS_TYPE } from "@/config/constants";

// ============================================
// fetchPullRequestsWithFilter
// ============================================
// Fetches PRs from Supabase with optional status filter.
// Includes repository name for display in the table.

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
    .limit(200); // Cap at 200 for MVP performance

  // Apply status filter if not 'all'
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch pull requests: ${error.message}`);
  }

  return (data ?? []) as PullRequest[];
}

// ============================================
// usePullRequestList
// ============================================
// Hook for the PR list table.
// Accepts a status filter and page number.

export function usePullRequestList(
  teamId: string | null | undefined,
  statusFilter: PR_STATUS_TYPE | "all" = "all",
  page: number = 1,
) {
  const {
    data: allPRs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pull-requests-list", teamId, statusFilter],
    queryFn: () => fetchPullRequestsWithFilter(teamId!, statusFilter),
    enabled: !!teamId,
    staleTime: QUERY_STALE_TIME,
  });

  // Client-side pagination
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
