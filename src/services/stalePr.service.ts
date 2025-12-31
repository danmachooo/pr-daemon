import { prisma } from "../lib/prisma";
import { PRStatus } from "../generated/prisma/enums";
import { appConfig } from "../../config/appConfig";
import app from "../app";

export async function findStalePullRequests() {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - appConfig.app.stale_days);

  return prisma.pullRequest.findMany({
    where: {
      status: PRStatus.OPEN,
      openedAt: {
        lte: thresholdDate,
      },
    },
    include: {
      repository: true,
    },
  });
}
