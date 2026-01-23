import { appConfig } from "../../config/appConfig";
import { PRStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

type SortOrder = "latest" | "oldest" | "all";

interface FindUnreviewedPullRequestsOptions {
  sortOrder?: SortOrder;
  limit?: number;
}

export async function findUnreviewedPullRequests(
  teamId: number,
  options: FindUnreviewedPullRequestsOptions = {},
) {
  const { sortOrder = "all", limit } = options;

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
    ...(sortOrder !== "all" && {
      orderBy: {
        openedAt: sortOrder === "latest" ? "desc" : "asc",
      },
    }),
    ...(limit && sortOrder !== "all" && { take: limit }),
  });

  return unreviewedPrs;
}
