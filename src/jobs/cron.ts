import cron from "node-cron";
import { findStalePullRequests } from "../services/stalePr.service";
import { alertOnStalePRs } from "../services/alert.service";
export function startCronJobs() {
  cron.schedule("*/1 * * * *", async () => {
    console.log("⏰ Checking for stale PRs...");

    const stalePRs = await findStalePullRequests();
    console.log(`⚠️ Found ${stalePRs.length} stale PR(s)`);

    for (const pr of stalePRs) {
      if (pr.alertedAt) console.log("Alert already sent.");
      console.log(`PR #${pr.prNumber} in ${pr.repository.name} is stale`);
    }

    await alertOnStalePRs(stalePRs);
  });
}
