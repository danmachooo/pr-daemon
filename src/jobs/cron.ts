import cron from "node-cron";
import Logger from "../utils/logger";
import { findStalePullRequests } from "../services/stalePr.service";
import { findUnreviewedPullRequests } from "../services/unreviewedPr.service";
import { findStalledPrs } from "../services/stalledPr.service";
import {
  alertOnStalePRs,
  alertOnStalledPRs,
  alertOnUnreviewedPRs,
} from "../services/alert.service";

export async function startCronJobs() {
  // Runs every minute at the 5-second mark
  cron.schedule("3 * * * * *", async () => {
    Logger.info("Cron: Starting PR Health Checks...");

    try {
      const [stalePRs, unreviewedPrs, stalledPrs] = await Promise.all([
        findStalePullRequests(),
        findUnreviewedPullRequests(),
        findStalledPrs(),
      ]);

      // 1. Handle Stale
      if (stalePRs.length > 0) {
        Logger.warn(`Cron: Found ${stalePRs.length} stale PR(s)`);
        await alertOnStalePRs(stalePRs);
      }

      // 2. Handle Unreviewed
      if (unreviewedPrs.length > 0) {
        Logger.warn(`Cron: Found ${unreviewedPrs.length} unreviewed PR(s)`);
        await alertOnUnreviewedPRs(unreviewedPrs);
      }

      // 3. Handle Stalled
      if (stalledPrs.length > 0) {
        Logger.warn(`Cron: Found ${stalledPrs.length} stalled PR(s)`);
        await alertOnStalledPRs(stalledPrs);
      }

      // --- ADDED SUMMARY LOG ---
      Logger.info("Cron: PR Health Checks finished.", {
        results: {
          stale: stalePRs.length,
          unreviewed: unreviewedPrs.length,
          stalled: stalledPrs.length,
        },
      });
    } catch (err: any) {
      Logger.error("Cron: Global PR check failed", { error: err.message });
    }
  });
}
