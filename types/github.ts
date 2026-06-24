export type GitHubUser = {
  login: string; // GitHub username
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
};

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  description: string | null;
  updated_at: string;
};

export type GitHubPullRequest = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed"; // GitHub only has these two states
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  draft: boolean;
  requested_reviewers: Array<{
    login: string;
    avatar_url: string;
  }>;
};
