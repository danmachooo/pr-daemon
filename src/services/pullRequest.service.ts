import { prisma } from "@/lib/prisma";
import { CompletedReviewRecord } from "@/schema/github/webhook";
import { completedReviewRecordSchema } from "@/schema/github/webhook/completeReviewRecord.schema";
import { PullRequestIdentifier, ClosePullRequest, UpsertPullRequest, ReviewData } from "@/types/github/prs";
import { PRStatus } from "@prisma/client";
import z from "zod";

export async function prAlreadyExist(data: PullRequestIdentifier) {
  return await prisma.pullRequest.findUnique({
    where: {
      repoId_prNumber: { repoId: data.repoId, prNumber: data.prNumber },
    },
  });
}

export async function closePullRequest(data: ClosePullRequest) {
  const { repoId, prNumber, closedAt } = data;
  if (data.repoId === undefined || data.prNumber === undefined) {
    throw new Error(
      "repoId and prNumber are required to close a Pull Request.",
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
    },
    create: {
      prNumber,
      openedAt,
      ...updateFields,
      repository: {
        connectOrCreate: {
          where: { id: repoId },
          create: {
            id: repoId,
            name: repoName,
            fullName: repoFullName,
            teamId,
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
  reviewData: ReviewData
) {
  const { repoId, prNumber } = data;

  const pr = await prisma.pullRequest.findUnique({
    where: { repoId_prNumber: { repoId, prNumber } },
    select: { completedReviewers: true },
  });

  const history = z
    .array(completedReviewRecordSchema)
    .catch([])
    .parse(pr?.completedReviewers);

  const alreadyRecorded = history.some((r) => r.reviewId === reviewData.reviewId);
  if (alreadyRecorded) return;

  const submittedAt = reviewData.submittedAt ?? new Date().toISOString();

  const nextHistory: CompletedReviewRecord[] = [
    ...history,
    {
      reviewId: reviewData.reviewId,
      reviewerId: reviewData.reviewerId,
      reviewerLogin: reviewData.reviewerLogin,
      state: reviewData.state,
      submittedAt,
    },
  ];

  return prisma.pullRequest.update({
    where: { repoId_prNumber: { repoId, prNumber } },
    data: {
      reviewCount: { increment: 1 },
      lastReviewAt: new Date(submittedAt),
      completedReviewers: nextHistory,
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

export async function markStalledAlert(id: number) {
  await prisma.pullRequest.update({
    where: { id },
    data: { stalledAlertAt: new Date() },
  });
}
