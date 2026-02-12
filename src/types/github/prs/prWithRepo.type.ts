import type { PullRequest, Repository } from "../../../generated/prisma/client";

export type PullRequestWithRepo = PullRequest & {
  repository: Repository;
};