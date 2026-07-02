"use client";

import { useState } from "react";
import { usePullRequestList } from "@/hooks/usePullRequests";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, formatDate } from "@/lib/utils/date-helpers";
import { PR_STATUS, type PR_STATUS_TYPE } from "@/config/constants";
import type { PullRequest } from "@/types/database";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";

// ============================================
// STATUS FILTER OPTIONS
// ============================================

const STATUS_FILTERS: { label: string; value: PR_STATUS_TYPE | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: PR_STATUS.OPEN },
  { label: "In Review", value: PR_STATUS.IN_REVIEW },
  { label: "Approved", value: PR_STATUS.APPROVED },
  { label: "Merged", value: PR_STATUS.MERGED },
  { label: "Closed", value: PR_STATUS.CLOSED },
];

// ============================================
// PRListSkeleton
// ============================================

function PRListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b border-gray-100"
            >
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// PRRow
// ============================================
// A single row in the PR table.

type PRWithRepo = PullRequest & {
  repositories?: {
    name: string;
    full_name: string;
    owner: string;
  };
};

function PRRow({ pr }: { pr: PRWithRepo }) {
  const repoName = pr.repositories?.full_name ?? "Unknown repo";

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors duration-100">
      {/* Author avatar */}
      <div className="flex-shrink-0">
        {pr.author_avatar_url ? (
          <Image
            src={pr.author_avatar_url}
            alt={pr.author_username}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-500">
              {pr.author_username[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* PR title and metadata */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{pr.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">#{pr.number}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400 truncate">{repoName}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">{pr.author_username}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <StatusBadge status={pr.status as PR_STATUS_TYPE} />
      </div>

      {/* Date */}
      <div className="flex-shrink-0 text-right hidden sm:block">
        <p className="text-xs text-gray-400">
          {formatRelativeTime(pr.github_created_at)}
        </p>
        <p className="text-xs text-gray-300">
          {formatDate(pr.github_created_at)}
        </p>
      </div>
    </div>
  );
}

// ============================================
// Pagination
// ============================================

type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

function Pagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-gray-400">
        Showing page {page} of {totalPages} ({totalCount} total)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ============================================
// PRList
// ============================================
// The full PR list with filter tabs and pagination.

export default function PRList() {
  const [statusFilter, setStatusFilter] = useState<PR_STATUS_TYPE | "all">(
    "all",
  );
  const [page, setPage] = useState(1);

  // NEW — no teamId parameter needed
  const { prs, totalCount, totalPages, isLoading, error } = usePullRequestList(
    statusFilter,
    page,
  );

  // Reset to page 1 when filter changes
  function handleFilterChange(filter: PR_STATUS_TYPE | "all") {
    setStatusFilter(filter);
    setPage(1);
  }

  if (isLoading) return <PRListSkeleton />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Pull Requests
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{totalCount} total</p>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 mt-4 flex-wrap">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleFilterChange(filter.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150",
                statusFilter === filter.value
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Error state */}
        {error && (
          <div className="py-8 text-center">
            <p className="text-sm text-red-600">
              Failed to load pull requests: {error.message}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!error && prs.length === 0 && (
          <div className="py-12 text-center">
            <svg
              className="w-10 h-10 text-gray-200 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
              />
            </svg>
            <p className="text-sm text-gray-400">
              {statusFilter === "all"
                ? "No pull requests found. Sync GitHub data to get started."
                : `No ${statusFilter.replace("_", " ")} pull requests found.`}
            </p>
          </div>
        )}

        {/* PR rows */}
        {!error && prs.length > 0 && (
          <div>
            {prs.map((pr) => (
              <PRRow key={pr.id} pr={pr as PRWithRepo} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
        />
      </CardContent>
    </Card>
  );
}
