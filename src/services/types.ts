// --- Shared Types ---
import { PullRequest, Repository } from "../generated/prisma/client";
import { PRStatus } from "../generated/prisma/enums";
import { RequestedReviewers } from "../webhooks/handlers/types";

export type PullRequestWithRepo = PullRequest & {
  repository: Repository;
};

export type PullRequestIdentifier = {
  repoId: number;
  prNumber: number;
};

// --- Function Specific Types ---

// Use Intersection (&) to include the identifier fields automatically
export type UpsertPullRequest = PullRequestIdentifier & {
  repoName: string;
  title: string;
  status: PRStatus;
  openedAt?: Date; // Make optional
  closedAt?: Date | null;
  lastCommitAt?: Date | null;
  reviewers?: RequestedReviewers[];
};

export type ClosePullRequestInput = PullRequestIdentifier & {
  closedAt?: Date;
};
