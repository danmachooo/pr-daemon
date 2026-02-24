import { PullRequest, Repository } from "@prisma/client";

export type PullRequestWithRepo = PullRequest & {
  repository: Repository;
};