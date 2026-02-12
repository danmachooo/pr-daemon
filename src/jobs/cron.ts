import cron from "node-cron";
import Logger from "../utils/logger";
import { decryptSecret } from "../services/secrets.service";
import { aadFor } from "../helpers/shared/aadFor.helper";
import {
  bulkUpdateLastRuleRunAt,
  bulkUpdateLastRuleErrorAt,
} from "../services/system.service";
import { findStalePullRequests } from "../rules/stalePr.rule";
import { findUnreviewedPullRequests } from "../rules/unreviewedPr.rule";
import { findStalledPrs } from "../rules/stalledPr.rule";
import {
  alertOnStalePRs,
  alertOnStalledPRs,
  alertOnUnreviewedPRs,
} from "../services/alert.service";
import {
  getTeamsWithWebhook,
  updateLastSlackSent,
} from "../services/team.service";

let isRunning = false;

export async function startCronJobs() {
  // Every 5 minutes at second 0
  cron.schedule("0 */5 * * * *", async () => {
    if (isRunning) {
      Logger.warn("Cron: Previous run still in progress, skipping tick");
      return;
    }

    isRunning = true;
    Logger.info("Cron: Starting PR Health Checks...");

    const successfulTeams: number[] = [];
    const erroredTeams: number[] = [];

    try {
      const teams = await getTeamsWithWebhook();

      for (const team of teams) {
        const teamId = team.id;

        try {
          // 1) Execute rules first (no decrypt unless needed)
          const [stalePRs, unreviewedPrs, stalledPrs] = await Promise.all([
            findStalePullRequests(teamId),
            findUnreviewedPullRequests(teamId),
            findStalledPrs(teamId),
          ]);

          const found = {
            stale: stalePRs.length,
            unreviewed: unreviewedPrs.length,
            stalled: stalledPrs.length,
          };

          const totalFound = found.stale + found.unreviewed + found.stalled;

          // Nothing to do for this team
          if (totalFound === 0) {
            successfulTeams.push(teamId);
            continue;
          }

          // 2) Decrypt Slack webhook only if we need to send alerts
          let slackWebhookUrl = "";
          try {
            slackWebhookUrl = decryptSecret(
              team.slackWebhookUrlEnc,
              aadFor(teamId, "slack"),
            );
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            Logger.error("Cron: Failed to decrypt Slack webhook", {
              teamId,
              error: message,
            });
          }

          const sentStale = await alertOnStalePRs(stalePRs, slackWebhookUrl);
          const sentUnreviewed = await alertOnUnreviewedPRs(
            unreviewedPrs,
            slackWebhookUrl,
          );
          const sentStalled = await alertOnStalledPRs(
            stalledPrs,
            slackWebhookUrl,
          );

          const totalSent = sentStale + sentUnreviewed + sentStalled;

          await updateLastSlackSent(teamId);

          if (sentStale > 0) {
            Logger.info("Cron: Slack alerts dispatched for stale PRs", {
              teamId,
              count: sentStale,
            });
          }
          if (sentUnreviewed > 0) {
            Logger.info("Cron: Slack alerts dispatched for unreviewed PRs", {
              teamId,
              count: sentUnreviewed,
            });
          }
          if (sentStalled > 0) {
            Logger.info("Cron: Slack alerts dispatched for stalled PRs", {
              teamId,
              count: sentStalled,
            });
          }

          if (totalFound > 0 && totalSent === 0) {
            Logger.info(
              "Cron: PR issues exist but Slack notifications were already sent previously",
              { teamId },
            );
          }

          successfulTeams.push(teamId);

          Logger.info("Cron: PR Health Checks finished.", {
            teamId,
            results: found,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          Logger.error("Cron: Team PR check failed", {
            teamId,
            error: message
          });
          erroredTeams.push(teamId);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)

      Logger.error("Cron: Failed to load teams", {
        error: message,
      });
    } finally {
      isRunning = false;

      await Promise.all([
        bulkUpdateLastRuleRunAt(successfulTeams),
        bulkUpdateLastRuleErrorAt(erroredTeams),
      ]);
    }
  });
}
