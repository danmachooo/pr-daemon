import { appConfig } from "@/config/appConfig";
import { prisma } from "@/lib/prisma";
import { FindStalePullRequestsOptions } from "@/types/rules";
import { PRStatus } from "@prisma/client";


export async function findStalePullRequests(
  teamId: number,
  options: FindStalePullRequestsOptions = {},
) {
  const { sortOrder = "all", limit } = options;

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
    ...(sortOrder !== "all" && {
      orderBy: {
        openedAt: sortOrder === "latest" ? "desc" : "asc",
      },
    }),
    ...(limit && sortOrder !== "all" && { take: limit }),
  });

  return stalePrs;
}
