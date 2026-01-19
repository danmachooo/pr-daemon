// src/webhooks/handlers/pullRequest.handler.ts
import { mapGitHubPayload } from "../../helpers/mapGithubPayload";
import {
  PullRequestEvent,
  PullRequestReviewEvent,
} from "../../schema/webhook.schema";
import {
  upsertPullRequest,
  resetPullRequestAlerts,
  closePullRequest,
  recordReviewSubmission,
} from "../../services/pullRequest.service";
import Logger from "../../utils/logger";

export async function handlePullRequestEvent(payload: PullRequestEvent) {
  const { action, pull_request, repository } = payload;

  const repoId = repository.id;
  const prNumber = pull_request.number;

  try {
    switch (action) {
      case "opened":
      case "reopened":
      case "synchronize":
      case "review_requested":
        const data = mapGitHubPayload(payload);
        await upsertPullRequest(data);

        if (action !== "opened") {
          await resetPullRequestAlerts({ repoId, prNumber });
        }
        break;

      case "closed":
        const closedAt = pull_request.closed_at
          ? new Date(pull_request.closed_at)
          : new Date();
        const result = await closePullRequest({ repoId, prNumber, closedAt });

        if (result.count === 0) {
          Logger.warn(
            `Attempted to close untracked PR: ${repository.name}#${prNumber}`,
          );
        }
        break;

      default:
        Logger.debug(`Unhandled PR action: ${action}`);
    }
  } catch (error) {
    Logger.error(`Failed to handle PR event ${action} for #${prNumber}`, error);
  }
}

export async function handlePullRequestReviewEvent(
  payload: PullRequestReviewEvent,
) {
  const { action, pull_request, repository, review } = payload;

  if (action !== "submitted") return;

  try {
    await recordReviewSubmission(
      {
        repoId: repository.id,
        prNumber: pull_request.number,
      },
      {
        id: review.user.id,
        login: review.user.login,
        state: review.state,
      },
    );
  } catch (error) {
    Logger.error(
      `Failed to record review for PR #${pull_request.number}`,
      error,
    );
  }
}
