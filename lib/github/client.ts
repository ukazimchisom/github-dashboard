import { Octokit } from "@octokit/rest";
import type { GitHubPullRequest, GitHubRepository } from "@/types/github";
import { GITHUB_PR_FETCH_LIMIT } from "@/config/constants";

// ============================================
// createGitHubClient
// ============================================
// Creates an authenticated Octokit instance using
// the user's GitHub OAuth access token.
// Each user gets their own client with their own permissions.

export function createGitHubClient(accessToken: string) {
  const octokit = new Octokit({
    auth: accessToken,
  });

  return {
    // ============================================
    // getRateLimit
    // ============================================
    // Checks how many API requests we have remaining.
    // Call this before a sync to warn users if they're low.

    async getRateLimit() {
      const { data } = await octokit.rest.rateLimit.get();
      return {
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        resetAt: new Date(data.rate.reset * 1000), // convert Unix timestamp
      };
    },

    // ============================================
    // getUserRepositories
    // ============================================
    // Fetches all repositories the authenticated user has access to.
    // Includes personal repos, org repos, and repos they collaborate on.

    async getUserRepositories(): Promise<GitHubRepository[]> {
      const repos: GitHubRepository[] = [];
      let page = 1;

      // Keep fetching pages until we get an empty page
      while (true) {
        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
          per_page: 100, // maximum allowed by GitHub
          page,
          sort: "updated", // most recently updated first
          direction: "desc",
        });

        if (data.length === 0) break; // no more pages

        // Map GitHub's response to our GitHubRepository type
        repos.push(
          ...data.map((repo) => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            owner: {
              login: repo.owner.login,
              avatar_url: repo.owner.avatar_url,
            },
            private: repo.private,
            description: repo.description ?? null,
            updated_at: repo.updated_at ?? new Date().toISOString(),
          })),
        );

        // If we got fewer than 100, this was the last page
        if (data.length < 100) break;
        page++;
      }

      return repos;
    },

    // ============================================
    // getPullRequests
    // ============================================
    // Fetches pull requests for a specific repository.
    // Fetches both open and closed (including merged) PRs.

    async getPullRequests(
      owner: string,
      repo: string,
    ): Promise<GitHubPullRequest[]> {
      const prs: GitHubPullRequest[] = [];
      let page = 1;

      while (true) {
        const { data } = await octokit.rest.pulls.list({
          owner,
          repo,
          state: "all", // fetch open AND closed/merged
          per_page: 100,
          page,
          sort: "updated",
          direction: "desc",
        });

        if (data.length === 0) break;

        prs.push(
          ...data.map((pr) => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            state: pr.state as "open" | "closed",
            user: {
              login: pr.user?.login ?? "unknown",
              avatar_url: pr.user?.avatar_url ?? "",
            },
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            closed_at: pr.closed_at ?? null,
            merged_at: pr.merged_at ?? null,
            draft: pr.draft ?? false,
            requested_reviewers: (pr.requested_reviewers ?? [])
              .filter(Boolean)
              .map((reviewer) => ({
                login: (reviewer as { login: string }).login,
                avatar_url: (reviewer as { avatar_url: string }).avatar_url,
              })),
          })),
        );

        // Stop if we've hit our fetch limit or last page
        if (data.length < 100 || prs.length >= GITHUB_PR_FETCH_LIMIT) break;
        page++;
      }

      return prs;
    },

    // ============================================
    // getAuthenticatedUser
    // ============================================
    // Returns the currently authenticated GitHub user's profile.

    async getAuthenticatedUser() {
      const { data } = await octokit.rest.users.getAuthenticated();
      return {
        login: data.login,
        id: data.id,
        avatar_url: data.avatar_url,
        name: data.name ?? null,
        email: data.email ?? null,
      };
    },
  };
}
