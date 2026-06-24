export type Team = {
  id: string; // UUID from Supabase
  name: string; // e.g. "Frontend Team"
  manager_id: string; // The user who owns this team
  created_at: string; // ISO timestamp
  updated_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string; // Foreign key → teams.id
  github_username: string; // e.g. "torvalds"
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Repository = {
  id: string;
  team_id: string; // Foreign key → teams.id
  github_repo_id: number; // GitHub's own numeric ID for the repo
  owner: string; // GitHub org or user, e.g. "facebook"
  name: string; // Repo name, e.g. "react"
  full_name: string; // "facebook/react"
  is_private: boolean;
  created_at: string;
  updated_at: string;
};

export type PullRequest = {
  id: string;
  repository_id: string; // Foreign key → repositories.id
  team_id: string; // Denormalized for easier querying
  github_pr_id: number; // GitHub's numeric PR ID
  number: number; // PR number within the repo (e.g. #42)
  title: string;
  author_username: string;
  author_avatar_url: string | null;
  status: "open" | "in_review" | "approved" | "merged" | "closed";
  github_created_at: string;
  github_merged_at: string | null;
  github_closed_at: string | null;
  review_time_hours: number | null; // Calculated: time from open to merge
  created_at: string;
  updated_at: string;
};
