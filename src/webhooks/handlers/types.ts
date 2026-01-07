// Define the shape of the GitHub objects we care about
export type RequestedReviewers = {
  id: number;
  login?: string; // Optional because it might be a Team
  slug?: string; // Added to support Teams
  submittedAt?: Date | string; // Only present in history
  type?: "User" | "Team"; // GitHub usually includes this field
  state?: string; // Only present in history (e.g., 'APPROVED')
};

export type GitHubReview = {
  id: number;
  user: {
    id: number;
    login: string;
  };
  state: "commented" | "approved" | "changes_requested" | string;
  submitted_at: string;
};

type GitHubRepository = {
  id: number;
  name: string;
};

type GitHubPullRequest = {
  number: number;
  title: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  requested_reviewers?: RequestedReviewers[] | null;
};

// The actual payload types
export type PullRequestWebhookPayload = {
  action: "opened" | "reopened" | "synchronize" | "closed" | string;
  pull_request: GitHubPullRequest;
  repository: GitHubRepository;
};

export type PullRequestReviewWebhookPayload = {
  action: "submitted" | string;
  pull_request: GitHubPullRequest;
  repository: GitHubRepository;
  review: GitHubReview;
};
