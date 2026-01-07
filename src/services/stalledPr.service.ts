import { appConfig } from "../../config/appConfig";
import { PRStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

export async function findStalledPrs() {
  const thresholdDate = new Date(
    Date.now() - appConfig.app.stall_hours_threshold * 60 * 60 * 1000
  );

  return await prisma.pullRequest.findMany({
    where: {
      status: PRStatus.OPEN,
      reviewCount: { gt: 0 },
      stalledAlertAt: null,
      // Logic: The author hasn't pushed code AND
      // the reviewer hasn't updated their review recently.
      AND: [
        {
          lastCommitAt: { lte: thresholdDate },
        },
        {
          lastReviewAt: { lte: thresholdDate },
        },
      ],
    },
    include: { repository: true },
  });
}
