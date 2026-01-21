import { prisma } from "../lib/prisma";
import { PRStatus } from "../generated/prisma/enums";
import { appConfig } from "../../config/appConfig";

export async function findStalePullRequests(teamId: number) {
  const thresholdDate = new Date();
  thresholdDate.setDate(
    thresholdDate.getDate() - appConfig.thresholds.staleDays,
  );

  const stalePrs = await prisma.pullRequest.findMany({
    where: {
      status: PRStatus.OPEN,
      openedAt: {
        lte: thresholdDate,
      },
      repository: {
        teamId,
      },
    },
    include: {
      repository: true,
    },
  });

  return stalePrs;
}
