import type { PRStatus } from "../../../generated/prisma/enums";
import type { PullRequestIdentifier } from "./prIdentifier.type";

export type Reviewer = {
  id: number;
  login: string;
  type: "User" | "Team";
  slug?: string;
};

export type UpsertPullRequest = PullRequestIdentifier & {
  repoName: string;
  repoFullName: string;
  teamId: number;

  title: string;
  author: string;

  status: PRStatus;

  openedAt: Date;
  closedAt?: Date;

  draft: boolean;

  lastCommitAt?: Date;

  reviewers: Reviewer[];
};
