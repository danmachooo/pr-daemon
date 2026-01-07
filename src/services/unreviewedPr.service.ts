import { appConfig } from "../../config/appConfig";
import { PRStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
const HOURS_24 = appConfig.app._24hr;

export async function findUnreviewedPullRequests() {
  const cutoff = new Date(Date.now() - HOURS_24);

  const unreviewedPrs = await prisma.pullRequest.findMany({
    where: {
      status: PRStatus.OPEN,
      reviewCount: 0,
      openedAt: { lte: cutoff },
    },
    include: { repository: true },
  });

  return unreviewedPrs;
}
