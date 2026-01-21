import { appConfig } from "../../config/appConfig";
import { PRStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

export async function findUnreviewedPullRequests(teamId: number) {
  const cutoff = new Date(Date.now() - appConfig.app.msPerDay);

  const unreviewedPrs = await prisma.pullRequest.findMany({
    where: {
      status: PRStatus.OPEN,
      reviewCount: 0,
      openedAt: { lte: cutoff },
      repository: {
        teamId,
      },
    },
    include: { repository: true },
  });

  return unreviewedPrs;
}
