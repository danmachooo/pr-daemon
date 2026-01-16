import { prisma } from "../lib/prisma";
import { PRStatus } from "../generated/prisma/enums";
import {
  PullRequestIdentifier,
  ClosePullRequestInput,
  UpsertPullRequest,
} from "./types";
import { RequestedReviewer } from "../schema/webhook.schema";
// --- Service Functions ---

export async function prAlreadyExist(data: PullRequestIdentifier) {
  return await prisma.pullRequest.findUnique({
    where: {
      repoId_prNumber: { repoId: data.repoId, prNumber: data.prNumber },
    },
  });
}

export async function closePullRequest(data: ClosePullRequestInput) {
  const { repoId, prNumber, closedAt } = data;
  if (data.repoId === undefined || data.prNumber === undefined) {
    throw new Error(
      "repoId and prNumber are required to close a Pull Request."
    );
  }

  return await prisma.pullRequest.updateMany({
    where: { repoId, prNumber },
    data: {
      status: PRStatus.CLOSED,
      closedAt: closedAt,
      staleAlertAt: null,
      unreviewedAlertAt: null,
    },
  });
}

export async function resetPullRequestAlerts(data: PullRequestIdentifier) {
  await prisma.pullRequest.update({
    where: {
      repoId_prNumber: data,
    },
    data: {
      staleAlertAt: null,
      unreviewedAlertAt: null,
      updatedAt: new Date(),
    },
  });
}

export async function upsertPullRequest(data: UpsertPullRequest) {
  const {
    repoId,
    repoName,
    repoFullName,
    teamId,
    prNumber,
    openedAt,
    ...updateFields
  } = data;

  return await prisma.pullRequest.upsert({
    where: {
      repoId_prNumber: { repoId, prNumber },
    },
    update: {
      ...updateFields,
      repository: {
        connectOrCreate: {
          where: { id: repoId },
          create: {
            id: repoId,
            name: repoName,
            fullName: repoFullName, // Add this
            teamId: teamId, // Add this
          },
        },
      },
    },
    create: {
      prNumber,
      openedAt: openedAt || new Date(),
      ...updateFields,
      repository: {
        connectOrCreate: {
          where: { id: repoId },
          create: {
            id: repoId,
            name: repoName,
            fullName: repoFullName, // Add this
            teamId: teamId, // Add this
          },
        },
      },
    },
  });
}

export async function incrementReviewCount(data: PullRequestIdentifier) {
  await prisma.pullRequest.update({
    where: {
      repoId_prNumber: data,
    },
    data: {
      reviewCount: { increment: 1 },
      lastReviewAt: new Date(),
    },
  });
}

export async function recordReviewSubmission(
  data: PullRequestIdentifier,
  reviewData: { id: number; login: string; state: string }
) {
  const { repoId, prNumber } = data;

  const pr = await prisma.pullRequest.findUnique({
    where: { repoId_prNumber: { repoId, prNumber } },
    select: { completedReviewers: true },
  });

  const history =
    (pr?.completedReviewers as unknown as RequestedReviewer[]) || [];

  const alreadyRecorded = history.some(
    (r) => r.id === reviewData.id && r.state === reviewData.state
  );

  if (alreadyRecorded) {
    return;
  }

  history.push({
    ...reviewData,
    submittedAt: String(new Date()),
  });

  return await prisma.pullRequest.update({
    where: { repoId_prNumber: { repoId, prNumber } },
    data: {
      reviewCount: { increment: 1 },
      lastReviewAt: new Date(),
      completedReviewers: history,
      unreviewedAlertAt: null,
    },
  });
}

export async function markUnreviewedAlert(id: number) {
  await prisma.pullRequest.update({
    where: { id },
    data: { unreviewedAlertAt: new Date() },
  });
}

export async function markStaleAlert(id: number) {
  await prisma.pullRequest.update({
    where: { id },
    data: { staleAlertAt: new Date() },
  });
}
