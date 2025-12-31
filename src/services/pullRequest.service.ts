import { prisma } from "../lib/prisma";
import { PRStatus } from "../generated/prisma/enums";

type UpsertPullRequest = {
  repoId: number;
  repoName: string;
  prNumber: number;
  title: string;
  status: PRStatus;
  openedAt: Date;
  closedAt?: Date | null;
};

export async function resetPullRequest(data: Partial<UpsertPullRequest>) {
  if (data.repoId === undefined || data.prNumber === undefined) {
    throw new Error(
      "repoId and prNumber are required to reset a Pull Request."
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
      alertedAt: null,
    },
  });
}
export async function upsertPullRequest(data: UpsertPullRequest) {
  await prisma.repository.upsert({
    where: { id: data.repoId },
    update: {},
    create: {
      id: data.repoId,
      name: data.repoName,
    },
  });

  return await prisma.pullRequest.upsert({
    where: {
      repoId_prNumber: {
        repoId: data.repoId,
        prNumber: data.prNumber,
      },
    },
    update: { title: data.title, status: data.status, closedAt: data.closedAt },
    create: {
      repoId: data.repoId,
      prNumber: data.prNumber,
      title: data.title,
      status: data.status,
      openedAt: data.openedAt,
      closedAt: data.closedAt,
    },
  });
}
