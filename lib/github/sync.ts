import { createGitHubClient } from "./client";
import { calculateReviewTimeHours } from "@/lib/utils/date-helpers";
import { TABLES } from "@/config/constants";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GitHubPullRequest, GitHubRepository } from "@/types/github";

// ============================================
// SyncResult
// ============================================
// What we return after a sync so the UI can show progress

export type SyncResult = {
  success: boolean;
  repositoriesSynced: number;
  pullRequestsSynced: number;
  errors: string[];
};

// ============================================
// determinePRStatus
// ============================================
// GitHub only has "open" and "closed" states.
// We map these to our more granular statuses.
//
// Logic:
// - merged_at exists → "merged"
// - state is "closed" but no merged_at → "closed"
// - draft is true → "open" (drafts show as open)
// - has requested reviewers → "in_review"
// - otherwise → "open"

function determinePRStatus(
  pr: GitHubPullRequest,
): "open" | "in_review" | "approved" | "merged" | "closed" {
  if (pr.merged_at) return "merged";
  if (pr.state === "closed") return "closed";
  if (pr.requested_reviewers && pr.requested_reviewers.length > 0) {
    return "in_review";
  }
  return "open";
}

// ============================================
// syncRepositories
// ============================================
// Fetches repositories from GitHub and upserts them into Supabase.
// Returns the list of synced repositories.

async function syncRepositories(
  supabase: SupabaseClient,
  teamId: string,
  repositories: GitHubRepository[],
): Promise<{ id: string; owner: string; name: string }[]> {
  if (repositories.length === 0) return [];

  // Transform GitHub repos into our database format
  const reposToUpsert = repositories.map((repo) => ({
    team_id: teamId,
    github_repo_id: repo.id,
    owner: repo.owner.login,
    name: repo.name,
    full_name: repo.full_name,
    is_private: repo.private,
    updated_at: new Date().toISOString(),
  }));

  // Upsert: insert new repos, update existing ones
  // onConflict: if team_id + github_repo_id already exists, update it
  const { data, error } = await supabase
    .from(TABLES.REPOSITORIES)
    .upsert(reposToUpsert, {
      onConflict: "team_id,github_repo_id",
    })
    .select("id, owner, name");

  if (error) {
    throw new Error(`Failed to sync repositories: ${error.message}`);
  }

  return data ?? [];
}

// ============================================
// syncPullRequestsForRepo
// ============================================
// Fetches PRs from GitHub for one repository and upserts into Supabase.

async function syncPullRequestsForRepo(
  supabase: SupabaseClient,
  teamId: string,
  repositoryId: string,
  owner: string,
  repoName: string,
  githubClient: ReturnType<typeof createGitHubClient>,
): Promise<number> {
  // Fetch PRs from GitHub
  const githubPRs = await githubClient.getPullRequests(owner, repoName);

  if (githubPRs.length === 0) return 0;

  // Transform into our database format
  const prsToUpsert = githubPRs.map((pr) => ({
    repository_id: repositoryId,
    team_id: teamId,
    github_pr_id: pr.id,
    number: pr.number,
    title: pr.title,
    author_username: pr.user.login,
    author_avatar_url: pr.user.avatar_url || null,
    status: determinePRStatus(pr),
    github_created_at: pr.created_at,
    github_merged_at: pr.merged_at,
    github_closed_at: pr.closed_at,
    // Calculate review time only for merged PRs
    review_time_hours: calculateReviewTimeHours(pr.created_at, pr.merged_at),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from(TABLES.PULL_REQUESTS)
    .upsert(prsToUpsert, {
      onConflict: "repository_id,github_pr_id",
    });

  if (error) {
    throw new Error(
      `Failed to sync PRs for ${owner}/${repoName}: ${error.message}`,
    );
  }

  return githubPRs.length;
}

// ============================================
// syncGitHubData
// ============================================
// Main sync function — orchestrates the full sync flow:
// 1. Check rate limit
// 2. Fetch user's repositories from GitHub
// 3. Upsert repositories into Supabase
// 4. For each repository, fetch and upsert PRs
// 5. Return summary of what was synced

export async function syncGitHubData(
  supabase: SupabaseClient,
  accessToken: string,
  teamId: string,
  onProgress?: (message: string) => void,
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    repositoriesSynced: 0,
    pullRequestsSynced: 0,
    errors: [],
  };

  // Helper to log progress both to callback and console
  const log = (message: string) => {
    console.log(`[Sync] ${message}`);
    onProgress?.(message);
  };

  try {
    const githubClient = createGitHubClient(accessToken);

    // Step 1 — Check rate limit before starting
    log("Checking GitHub API rate limit...");
    const rateLimit = await githubClient.getRateLimit();
    log(
      `Rate limit: ${rateLimit.remaining}/${rateLimit.limit} requests remaining`,
    );

    if (rateLimit.remaining < 100) {
      const resetTime = rateLimit.resetAt.toLocaleTimeString();
      throw new Error(
        `GitHub API rate limit too low (${rateLimit.remaining} remaining). Resets at ${resetTime}.`,
      );
    }

    // Step 2 — Fetch repositories from GitHub
    log("Fetching repositories from GitHub...");
    const githubRepos = await githubClient.getUserRepositories();
    log(`Found ${githubRepos.length} repositories`);

    if (githubRepos.length === 0) {
      log("No repositories found. Make sure you have access to repositories.");
      result.success = true;
      return result;
    }

    // Step 3 — Upsert repositories into Supabase
    log("Syncing repositories to database...");
    const syncedRepos = await syncRepositories(supabase, teamId, githubRepos);
    result.repositoriesSynced = syncedRepos.length;
    log(`Synced ${syncedRepos.length} repositories`);

    // Step 4 — Fetch PRs for each repository
    // We limit to first 10 repos for MVP to avoid hitting rate limits
    const reposToSync = syncedRepos.slice(0, 10);
    log(`Fetching pull requests for ${reposToSync.length} repositories...`);

    for (const repo of reposToSync) {
      try {
        log(`Syncing PRs for ${repo.owner}/${repo.name}...`);
        const prCount = await syncPullRequestsForRepo(
          supabase,
          teamId,
          repo.id,
          repo.owner,
          repo.name,
          githubClient,
        );
        result.pullRequestsSynced += prCount;
        log(`  → ${prCount} PRs synced`);
      } catch (repoError) {
        // Don't fail the entire sync if one repo fails
        const errorMessage =
          repoError instanceof Error ? repoError.message : "Unknown error";
        result.errors.push(errorMessage);
        log(`  → Error: ${errorMessage}`);
      }
    }

    result.success = true;
    log(
      `Sync complete! ${result.repositoriesSynced} repos, ${result.pullRequestsSynced} PRs`,
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown sync error";
    result.errors.push(errorMessage);
    log(`Sync failed: ${errorMessage}`);
  }

  return result;
}
