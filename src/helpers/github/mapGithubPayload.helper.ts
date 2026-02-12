import { PRStatus } from "../../generated/prisma/enums";
import { PullRequestEvent } from "../../schema/github/webhook";
import type { UpsertPullRequest } from "../../types/github/prs";

export function mapGitHubPayload(
  payload: PullRequestEvent,
  teamId: number,
): UpsertPullRequest {
  const { pull_request, repository } = payload;

  return {
    repoId: repository.id,
    repoName: repository.name,
    repoFullName: repository.full_name,
    teamId,

    prNumber: pull_request.number,
    title: pull_request.title,
    author: pull_request.user.login,

    status: pull_request.state === "open" ? PRStatus.OPEN : PRStatus.CLOSED,

    openedAt: new Date(pull_request.created_at),
    closedAt: pull_request.closed_at ? new Date(pull_request.closed_at) : undefined,

    draft: pull_request.draft ?? false,

    // webhook doesn't include "last commit time" directly; updated_at is a good proxy
    lastCommitAt: new Date(pull_request.updated_at),

    reviewers: (pull_request.requested_reviewers ?? []).map((r) => ({
      id: r.id,
      login: r.type === "Team" ? (r.slug ?? r.login) : r.login,
      type: r.type ?? "User",
      ...(r.slug ? { slug: r.slug } : {}),
    })),
  };
}
