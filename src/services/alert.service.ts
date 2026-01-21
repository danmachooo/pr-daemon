import { markStaleAlert, markUnreviewedAlert } from "./pullRequest.service";
import { sendSlackAlert } from "./slack.service";
import { PullRequestWithRepo } from "./types";
import {
  parseReviewers,
  formatReviewerNames,
  getLastReviewer,
  formatLastActivity,
  formatPRLink,
  formatOpenedDate,
} from "../helpers/alert.helper";

export async function alertOnStalePRs(
  stalePrs: PullRequestWithRepo[],
  slackWebhookUrl: string,
) {
  for (const pr of stalePrs) {
    // If we've already alerted, skip
    if (pr.staleAlertAt) continue;

    const message =
      `*🚨 Stale Pull Request Detected*\n` +
      `${formatPRLink(pr.prNumber, pr.title)}\n` +
      `> *Repo:* ${pr.repository.name}\n` +
      `> *Opened:* ${formatOpenedDate(pr.openedAt)}`;

    await sendSlackAlert(message, { webhookUrl: slackWebhookUrl });
    await markStaleAlert(pr.id);
  }
}

export async function alertOnUnreviewedPRs(
  prs: PullRequestWithRepo[],
  slackWebhookUrl: string,
) {
  for (const pr of prs) {
    // Only alert if we haven't already
    if (pr.unreviewedAlertAt) continue;

    const pendingReviewers = parseReviewers(pr.reviewers);
    const reviewerNames = formatReviewerNames(pendingReviewers);

    const message =
      `*👀 PR Needs Review*\n` +
      `${formatPRLink(pr.prNumber, pr.title)}\n` +
      `> *Repo:* ${pr.repository.name}\n` +
      `> *Current Reviewers:* ${reviewerNames}\n` +
      `> *Status:* Awaiting first review`;

    await sendSlackAlert(message, { webhookUrl: slackWebhookUrl });
    await markUnreviewedAlert(pr.id);
  }
}

export async function alertOnStalledPRs(
  prs: PullRequestWithRepo[],
  slackWebhookUrl: string,
) {
  for (const pr of prs) {
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

    await sendSlackAlert(message, { webhookUrl: slackWebhookUrl });
    await markStaleAlert(pr.id);
  }
}
