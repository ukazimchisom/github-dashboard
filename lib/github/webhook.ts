import { createHmac, timingSafeEqual } from "crypto";
import type { GitHubWebhookPayload } from "@/types/github";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TABLES } from "@/config/constants";
import { calculateReviewTimeHours } from "@/lib/utils/date-helpers";

// ============================================
// verifyWebhookSignature
// ============================================
// Verifies that a webhook payload came from GitHub
// and not from a malicious third party.
//
// GitHub signs the payload with HMAC-SHA256 using your secret.
// We compute the expected signature and compare it to what GitHub sent.
// timingSafeEqual prevents timing attacks.

export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;

  // GitHub sends signature as "sha256=<hex>"
  if (!signature.startsWith("sha256=")) return false;

  const expectedSignature =
    "sha256=" +
    createHmac("sha256", secret).update(payload, "utf8").digest("hex");

  // timingSafeEqual prevents timing attacks
  // (where an attacker can infer the secret by measuring response time)
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch {
    // Buffers were different lengths — signatures don't match
    return false;
  }
}

// ============================================
// determinePRStatusFromWebhook
// ============================================
// Maps webhook action + PR state to our status enum.
// More accurate than the sync version because we have
// the exact action that triggered the event.

function determinePRStatusFromWebhook(
  action: GitHubWebhookPayload["action"],
  pr: GitHubWebhookPayload["pull_request"],
): "open" | "in_review" | "approved" | "merged" | "closed" {
  // Merged takes priority — check this first
  if (pr.merged || pr.merged_at) return "merged";

  // Explicitly closed without merge
  if (pr.state === "closed") return "closed";

  // Review was requested — PR is in review
  if (action === "review_requested") return "in_review";

  // Draft PRs are just open
  if (pr.draft) return "open";

  // Has existing reviewers → in review
  if (pr.requested_reviewers && pr.requested_reviewers.length > 0) {
    return "in_review";
  }

  return "open";
}

// ============================================
// processWebhookEvent
// ============================================
// Main handler — processes a validated webhook payload.
// Finds the matching repository and upserts the PR.

export async function processWebhookEvent(
  supabase: SupabaseClient,
  payload: GitHubWebhookPayload,
): Promise<{ processed: boolean; message: string }> {
  const { action, pull_request: pr, repository } = payload;

  // We only care about pull_request events
  // (GitHub might send other event types to the same endpoint)
  if (!pr || !repository) {
    return { processed: false, message: "Not a pull_request event" };
  }

  // Find the repository in our database by GitHub repo ID
  // A repository might not exist if it hasn't been synced yet
  const { data: repoData, error: repoError } = await supabase
    .from(TABLES.REPOSITORIES)
    .select("id, team_id")
    .eq("github_repo_id", repository.id)
    .single();

  if (repoError || !repoData) {
    // Repository not tracked — ignore this webhook
    return {
      processed: false,
      message: `Repository ${repository.full_name} not found in database`,
    };
  }

  const status = determinePRStatusFromWebhook(action, pr);
  const reviewTimeHours = calculateReviewTimeHours(
    pr.created_at,
    pr.merged_at ?? null,
  );

  // Upsert the pull request
  const { error: upsertError } = await supabase
    .from(TABLES.PULL_REQUESTS)
    .upsert(
      {
        repository_id: repoData.id,
        team_id: repoData.team_id,
        github_pr_id: pr.id,
        number: pr.number,
        title: pr.title,
        author_username: pr.user.login,
        author_avatar_url: pr.user.avatar_url || null,
        status,
        github_created_at: pr.created_at,
        github_merged_at: pr.merged_at ?? null,
        github_closed_at: pr.closed_at ?? null,
        review_time_hours: reviewTimeHours,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "repository_id,github_pr_id",
      },
    );

  if (upsertError) {
    throw new Error(`Failed to upsert PR: ${upsertError.message}`);
  }

  return {
    processed: true,
    message: `PR #${pr.number} ${action} — status: ${status}`,
  };
}
