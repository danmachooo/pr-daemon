import { appConfig } from "@/config/appConfig";
import { prisma } from "@/lib/prisma";
import { PRStatus } from "@prisma/client";


type SortOrder = "latest" | "oldest" | "all";

interface FindStalledPrsOptions {
  sortOrder?: SortOrder;
  limit?: number;
}

export async function findStalledPrs(
  teamId: number,
  options: FindStalledPrsOptions = {},
) {
  const { sortOrder = "all", limit } = options;

  const thresholdDate = new Date(
    Date.now() - appConfig.thresholds.stallHours * 60 * 60 * 1000,
  );

  return await prisma.pullRequest.findMany({
    where: {
      repository: {
        teamId,
      },
      status: PRStatus.OPEN,
      stalledAlertAt: null, // Don't alert if we already did

      // A PR is stalled if it has been "touched" but no progress made recently
      OR: [
        {
          // Case 1: It has reviews, but activity stopped
          reviewCount: { gt: 0 },
          AND: [
            { lastCommitAt: { lte: thresholdDate } },
            { lastReviewAt: { lte: thresholdDate } },
          ],
        },
        {
          // Case 2: No reviews at all, and the author hasn't pushed
          // (This captures PRs that were opened and forgotten)
          reviewCount: 0,
          openedAt: { lte: thresholdDate },
          lastCommitAt: { lte: thresholdDate },
        },
      ],
    },
    include: { repository: true },
    ...(sortOrder !== "all" && {
      orderBy: {
        // Sort by last activity (most recent between commit and review)
        lastCommitAt: sortOrder === "latest" ? "desc" : "asc",
      },
    }),
    ...(limit && sortOrder !== "all" && { take: limit }),
  });
}
