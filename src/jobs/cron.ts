import cron from "node-cron";
import Logger from "../utils/logger";
import { findStalePullRequests } from "../rules/stalePr.rule";
import { findUnreviewedPullRequests } from "../rules/unreviewedPr.rule";
import { findStalledPrs } from "../rules/stalledPr.rule";
import {
  alertOnStalePRs,
  alertOnStalledPRs,
  alertOnUnreviewedPRs,
} from "../services/alert.service";
import {
  updateLastRuleRunAt,
  updateLastRuleErrorAt,
  bulkUpdateLastRuleRunAt,
  bulkUpdateLastRuleErrorAt,
} from "../services/system.service";
import { prisma } from "../lib/prisma";
import { decryptSecret } from "../services/secrets.service";
import { aadFor } from "../helpers/aadFor";

let isRunning = false;

export async function startCronJobs() {
  // Runs every 30 seconds
  cron.schedule("*/30 * * * * *", async () => {
    if (isRunning) {
      Logger.warn("Cron: Previous run still in progress, skipping tick");
      return;
    }

    // Track result timestamp for each team
    const successfulTeams: number[] = [];
    const erroredTeams: number[] = [];

    isRunning = true;
    Logger.info("Cron: Starting PR Health Checks...");

    try {
      const teams = await prisma.team.findMany({
        select: { id: true, slackWebhookUrlEnc: true },
      });

      for (const team of teams) {
        const teamId = team.id;

        // Decrypt Slack Webhook
        let slackWebhookUrl = "";
        try {
          slackWebhookUrl = decryptSecret(
            team.slackWebhookUrlEnc,
            aadFor(teamId, "slack"),
          );
        } catch (e: any) {
          Logger.error("Cron: Failed to decrypt Slack webhook", {
            teamId,
            error: e?.message ?? String(e),
          });
        }

        try {
          // Execute Rules
          const [stalePRs, unreviewedPrs, stalledPrs] = await Promise.all([
            findStalePullRequests(teamId),
            findUnreviewedPullRequests(teamId),
            findStalledPrs(teamId),
          ]);

          // Handle Alerts
          if (!slackWebhookUrl) {
            if (stalePRs.length || unreviewedPrs.length || stalledPrs.length) {
              Logger.warn(
                "Cron: Alerts skipped (no Slack webhook configured)",
                {
                  teamId,
                  results: {
                    stale: stalePRs.length,
                    unreviewed: unreviewedPrs.length,
                    stalled: stalledPrs.length,
                  },
                },
              );
            }
          } else {
            const sentStale = await alertOnStalePRs(stalePRs, slackWebhookUrl);
            const sentUnreviewed = await alertOnUnreviewedPRs(
              unreviewedPrs,
              slackWebhookUrl,
            );
            const sentStalled = await alertOnStalledPRs(
              stalledPrs,
              slackWebhookUrl,
            );

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

            // Optional: Log if rules found issues but no Slack was sent because they were already alerted
            const totalFound =
              stalePRs.length + unreviewedPrs.length + stalledPrs.length;
            const totalSent = sentStale + sentUnreviewed + sentStalled;

            if (totalFound > 0 && totalSent === 0) {
              Logger.info(
                "Cron: PR issues exist but Slack notifications were already sent previously",
                { teamId },
              );
            }
          }

          // Success: Update Last Rule Run

          // await updateLastRuleRunAt(teamId); // Use only for small number of teams in db
          successfulTeams.push(team.id);

          Logger.info("Cron: PR Health Checks finished.", {
            teamId,
            results: {
              stale: stalePRs.length,
              unreviewed: unreviewedPrs.length,
              stalled: stalledPrs.length,
            },
          });
        } catch (err: any) {
          // 5. Failure: Update Last Error
          Logger.error("Cron: Team PR check failed", {
            teamId,
            error: err?.message ?? String(err),
          });

          // await updateLastRuleErrorAt(teamId); // Use only for small number of teams in db
          erroredTeams.push(team.id);
        }
      }
    } catch (err: any) {
      Logger.error("Cron: Failed to load teams", {
        error: err?.message ?? String(err),
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
