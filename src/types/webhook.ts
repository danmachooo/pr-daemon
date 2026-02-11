// Types related to Webhook operations

// From src/schema/webhook.schema.ts
export type RequestedReviewer = {
  login: string;
  id: number;
  type?: "User" | "Team";
  slug?: string; // For teams
  submittedAt: string | null;
  state: string | null;
};

export type PullRequestEvent = {
  action:
    | "opened"
    | "closed"
    | "reopened"
    | "synchronize"
    | "edited"
    | "assigned"
    | "unassigned"
    | "review_requested"
    | "review_request_removed"
    | "labeled"
    | "unlabeled";
  number: number;
  pull_request: {
    id: number;
    number: number;
    state: "open" | "closed";
    title: string;
    body: string | null;
    html_url: string;
    user: {
      login: string;
      id: number;
      avatar_url: string;
      type: "User" | "Team" | "Bot" | "Organization";
    };
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    merged_at: string | null;
    draft?: boolean;
    requested_reviewers: RequestedReviewer[];
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
      avatar_url: string;
      type: "User" | "Team" | "Bot" | "Organization";
    };
    html_url: string;
    description: string | null;
    private: boolean;
  };
  sender: {
    login: string;
    id: number;
    avatar_url: string;
    type: "User" | "Team" | "Bot" | "Organization";
  };
  requested_reviewer?: {
    login: string;
    id: number;
    avatar_url: string;
    type: "User" | "Team" | "Bot" | "Organization";
  };
};

export type PullRequestReviewEvent = {
  action: "submitted" | "edited" | "dismissed";
  review: {
    id: number;
    user: {
      login: string;
      id: number;
      avatar_url: string;
      type: "User" | "Team" | "Bot" | "Organization";
    };
    body: string | null;
    state: "approved" | "changes_requested" | "commented" | "dismissed";
    submitted_at: string;
  };
  pull_request: {
    id: number;
    number: number;
    state: "open" | "closed";
    title: string;
    body: string | null;
    html_url: string;
    user: {
      login: string;
      id: number;
      avatar_url: string;
      type: "User" | "Team" | "Bot" | "Organization";
    };
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    merged_at: string | null;
    draft?: boolean;
    requested_reviewers: RequestedReviewer[];
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
      avatar_url: string;
      type: "User" | "Team" | "Bot" | "Organization";
    };
    html_url: string;
    description: string | null;
    private: boolean;
  };
  sender: {
    login: string;
    id: number;
    avatar_url: string;
    type: "User" | "Team" | "Bot" | "Organization";
  };
};

export type GitHubEventType =
  | "pull_request"
  | "pull_request_review"
  | "push"
  | "issues"
  | "issue_comment"
  | "ping";
