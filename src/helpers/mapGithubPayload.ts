import { PRStatus } from "../generated/prisma/enums";
import { PullRequestEvent } from "../schema/webhook.schema";

export function mapGitHubPayload(payload: PullRequestEvent) {
  const { pull_request, repository } = payload;

  return {
    repoId: repository.id,
    repoName: repository.name,
    repoFullName: repository.full_name, // Add this
    teamId: repository.owner.id,
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
          ? (r.slug ?? "unknown-team")
          : (r.login ?? "unknown-user"),
      type: r.type ?? "User",
      submittedAt: null, // Requested reviewers haven't submitted yet
      state: null,
      ...(r.slug && { slug: r.slug }),
    })),
  };
}
