import { prisma } from "../lib/prisma";
import { PRStatus } from "../generated/prisma/enums";
import { awaitShutdown } from "./../../node_modules/effect/src/TPubSub";

export type UpsertPullRequest = {
  repoId: number;
  repoName: string;
  prNumber: number;
  title: string;
  status: PRStatus;
  openedAt: Date;
  closedAt?: Date | null;
  lastCommitAt?: Date | null;
};

export async function closePullRequest(data: {
  repoId: number;
  prNumber: number;
  closedAt?: Date;
}) {
  if (data.repoId === undefined || data.prNumber === undefined) {
    throw new Error(
      "repoId and prNumber are required to close a Pull Request."
    );
  }

  await prisma.pullRequest.update({
    where: {
      repoId_prNumber: {
        repoId: data.repoId,
        prNumber: data.prNumber,
      },
    },
    data: {
      status: PRStatus.CLOSED,
      closedAt: data.closedAt ?? new Date(),
      staleAlertAt: null,
      unreviewedAlertAt: null,
    },
  });
}
export async function resetPullRequestAlerts({
  repoId,
  prNumber,
}: {
  repoId: number;
  prNumber: number;
}) {
  await prisma.pullRequest.update({
    where: {
      repoId_prNumber: {
        repoId,
        prNumber,
      },
    },
    data: {
      staleAlertAt: null,
      unreviewedAlertAt: null,
    },
  });
}
export async function upsertPullRequest(data: UpsertPullRequest) {
  // 1️⃣ Upsert repository
  await prisma.repository.upsert({
    where: { id: data.repoId },
    update: { name: data.repoName },
    create: { id: data.repoId, name: data.repoName },
  });

  // 2️⃣ Upsert pull request
  return await prisma.pullRequest.upsert({
    where: {
      repoId_prNumber: { repoId: data.repoId, prNumber: data.prNumber },
    },
    update: {
      status: data.status,
      closedAt: data.closedAt,
    },
    create: {
      repoId: data.repoId,
      prNumber: data.prNumber,
      title: data.title,
      status: data.status,
      openedAt: data.openedAt,
      closedAt: data.closedAt ?? null,
      lastCommitAt: data.lastCommitAt ?? null,
    },
  });
}
export async function incrementReviewCount({
  repoId,
  prNumber,
}: {
  repoId: number;
  prNumber: number;
}) {
  await prisma.pullRequest.update({
    where: {
      repoId_prNumber: {
        repoId,
        prNumber,
      },
    },
    data: {
      reviewCount: { increment: 1 },
      lastReviewAt: new Date(),
    },
  });
}

export async function markUnreviewedAlert(id: number) {
  await prisma.pullRequest.update({
    where: {
      id,
    },
    data: {
      unreviewedAlertAt: new Date(),
    },
  });
}

export async function markStaleAlert(id: number) {
  await prisma.pullRequest.update({
    where: {
      id,
    },
    data: {
      staleAlertAt: new Date(),
    },
  });
}
