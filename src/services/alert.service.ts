import { appConfig } from "@/config/appConfig";
import { formatPRLink, formatOpenedDate, sendQueued, parseReviewers, formatReviewerNames, getLastReviewer, formatLastActivity } from "@/helpers/alert/alert.helper";
import { PullRequestWithRepo } from "@/types/github/prs";
import { markStaleAlert, markUnreviewedAlert, markStalledAlert } from "./pullRequest.service";
import Logger from "@/utils/logger";

export async function alertOnStalePRs(
  stalePrs: PullRequestWithRepo[],
  slackWebhookUrl: string,
): Promise<number> {
  let sentCount = 0;

  for (const pr of stalePrs) {
    if (sentCount >= appConfig.app.maxAlertsPerTeam) break;
    if (pr.staleAlertAt) continue;

    const message =
      `*🚨 Stale Pull Request Detected*\n` +
      `${formatPRLink(pr.prNumber, pr.title)}\n` +
      `> *Repo:* ${pr.repository.name}\n` +
      `> *Opened:* ${formatOpenedDate(pr.openedAt)}`;

    const result = await sendQueued(slackWebhookUrl, message);

    if (result.success) {
      await markStaleAlert(pr.id);
      sentCount++;
    } else {
      Logger.error("Slack send failed (stale). Will retry next run.", {
        prId: pr.id,
        attempts: result.attempts,
        error: result.error,
      });
    }
  }

  return sentCount;
}

export async function alertOnUnreviewedPRs(
  prs: PullRequestWithRepo[],
  slackWebhookUrl: string,
): Promise<number> {
  let sentCount = 0;

  for (const pr of prs) {
    if (sentCount >= appConfig.app.maxAlertsPerTeam) break;
    if (pr.unreviewedAlertAt) continue;

    const pendingReviewers = parseReviewers(pr.reviewers);
    const reviewerNames = formatReviewerNames(pendingReviewers) || "None";

    const message =
      `*👀 PR Needs Review*\n` +
      `${formatPRLink(pr.prNumber, pr.title)}\n` +
      `> *Repo:* ${pr.repository.name}\n` +
      `> *Current Reviewers:* ${reviewerNames}\n` +
      `> *Status:* Awaiting first review`;

    const result = await sendQueued(slackWebhookUrl, message);

    if (result.success) {
      await markUnreviewedAlert(pr.id);
      sentCount++;
    } else {
      Logger.error("Slack send failed (unreviewed). Will retry next run.", {
        prId: pr.id,
        attempts: result.attempts,
        error: result.error,
      });
    }
  }

  return sentCount;
}

export async function alertOnStalledPRs(
  prs: PullRequestWithRepo[],
  slackWebhookUrl: string,
): Promise<number> {
  let sentCount = 0;

  for (const pr of prs) {
    if (sentCount >= appConfig.app.maxAlertsPerTeam) break;
    if (pr.stalledAlertAt) continue;

    const pendingReviewers = parseReviewers(pr.reviewers);
    const pendingNames = formatReviewerNames(pendingReviewers) || "None";

    const lastReviewer = getLastReviewer(pr.completedReviewers);
    const lastActivity = formatLastActivity(pr.lastReviewAt, lastReviewer);

    const message =
      `*🚧 PR is Stalled*\n` +
      `${formatPRLink(pr.prNumber, pr.title)}\n` +
      `> *Repo:* ${pr.repository.name}\n` +
      `> *Last Activity:* ${lastActivity}\n` +
      `> *Pending Reviewers:* ${pendingNames}\n` +
      `> *Action:* Please check if a follow-up is needed.`;

    const result = await sendQueued(slackWebhookUrl, message);

    if (result.success) {
      await markStalledAlert(pr.id);
      sentCount++;
    } else {
      Logger.error("Slack send failed (stalled). Will retry next run.", {
        prId: pr.id,
        attempts: result.attempts,
        error: result.error,
      });
    }
  }

  return sentCount;
}
