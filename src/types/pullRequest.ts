// Types related to Pull Request operations

import { PullRequest, Repository } from "../generated/prisma/client";
import { TeamIdentifier } from "./team";

// From src/services/pullRequest.types.ts
export type PullRequestWithRepo = PullRequest & {
  repository: Repository;
};

export type PullRequestIdentifier = {
  repoId: number;
  prNumber: number;
};

// Use Intersection (&) to include the identifier fields automatically
export type UpsertPullRequest = PullRequestIdentifier & {
  repoName: string;
  repoFullName: string
  teamId: number
  title: string;
  author: string;
  status: string;
  openedAt: Date;
  closedAt?: Date;
  mergedAt?: Date;
  reviewCount: number;
  commentCount: number;
  commitCount: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  draft: boolean;
  headRef: string;
  baseRef: string;
};

export type ClosePullRequestInput = PullRequestIdentifier & {
  closedAt?: Date;
};

// From src/rules/*.rule.ts
export type SortOrder = "latest" | "oldest" | "all";

export interface FindUnreviewedPullRequestsOptions {
  sortOrder?: SortOrder;
  limit?: number;
}

export interface FindStalledPrsOptions {
  sortOrder?: SortOrder;
  limit?: number;
}

export interface FindStalePullRequestsOptions {
  sortOrder?: SortOrder;
  limit?: number;
}
