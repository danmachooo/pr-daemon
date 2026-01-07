// src/webhooks/handlers/pullRequest.handler.ts
import { PRStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import {
  upsertPullRequest,
  resetPullRequestAlerts,
  closePullRequest,
  incrementReviewCount,
} from "../../services/pullRequest.service";
import Logger from "../../utils/logger";

export async function handlePullRequestEvent(payload: any) {
  const { action, pull_request, repository } = payload;
  if (!pull_request || !repository) return;

  const repoId = repository.id;
  const repoName = repository.name;
  const prNumber = pull_request.number;
  const prTitle = pull_request.title ?? "No title";
  Logger.info("Action: " + action);

  if (action === "opened" || action === "reopened") {
    // Safe upsert for opened PRs
    const openedAt = pull_request.created_at
      ? new Date(pull_request.created_at)
      : new Date();

    await upsertPullRequest({
      repoId,
      repoName,
      prNumber,
      title: prTitle,
      status: PRStatus.OPEN,
      openedAt,
      closedAt: pull_request.closed_at
        ? new Date(pull_request.closed_at)
        : null,
      lastCommitAt: new Date(),
    });
  }

  if (action === "synchronize") {
    await prisma.pullRequest.update({
      where: { repoId_prNumber: { repoId, prNumber } },
      data: {
        lastCommitAt: new Date(),
        stalledAlertAt: null,
      },
    });

    await resetPullRequestAlerts({ repoId, prNumber });
  }
  if (action === "closed") {
    // Closed PR: update only
    const closedAt = pull_request.closed_at
      ? new Date(pull_request.closed_at)
      : new Date();

    const existingPR = await prisma.pullRequest.findUnique({
      where: { repoId_prNumber: { repoId, prNumber } },
    });

    if (!existingPR) {
      throw new Error(
        `PR #${prNumber} in repo ${repoName} does not exist in DB. Cannot close non-existing PR.`
      );
    }

    await prisma.pullRequest.update({
      where: { repoId_prNumber: { repoId, prNumber } },
      data: {
        status: PRStatus.CLOSED,
        closedAt,
        title: prTitle,
      },
    });
  }

  if (action === "reopened" || action === "synchronize") {
    await resetPullRequestAlerts({ repoId, prNumber });
  }
}

export async function handlePullRequestReviewEvent(payload: any) {
  const { action, pull_request, repository } = payload;
  Logger.info("Action: " + action);

  if (action !== "submitted") return;

  await incrementReviewCount({
    repoId: repository.id,
    prNumber: pull_request.number,
  });
}
