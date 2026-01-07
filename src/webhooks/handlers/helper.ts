import { PRStatus } from "../../generated/prisma/enums";
import { PullRequestWebhookPayload } from "./types";

export function mapGitHubPayload(payload: PullRequestWebhookPayload) {
  const { pull_request, repository } = payload;

  return {
    repoId: repository.id,
    repoName: repository.name,
    prNumber: pull_request.number,
    title: pull_request.title,
    status: PRStatus.OPEN,
    updatedAt: pull_request.updated_at
      ? new Date(pull_request.updated_at)
      : new Date(),
    // Only include openedAt if created_at exists
    ...(pull_request.created_at && {
      openedAt: new Date(pull_request.created_at),
    }),
    closedAt: pull_request.closed_at ? new Date(pull_request.closed_at) : null,
    lastCommitAt: new Date(pull_request.updated_at),
    reviewers: (pull_request.requested_reviewers ?? []).map((r) => ({
      id: r.id,
      login:
        r.type === "Team"
          ? r.slug ?? "unknown-team"
          : r.login ?? "unknown-user",
      type: r.type ?? "User",
    })),
  };
}
