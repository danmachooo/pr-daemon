import { getHoursAgo } from "../helpers/hoursAgo";
import Logger from "../utils/logger";
import { RequestedReviewers } from "../webhooks/handlers/types";
import { markStaleAlert, markUnreviewedAlert } from "./pullRequest.service";
import { sendSlackAlert } from "./slack.service";
import { PullRequestWithRepo } from "./types";

export async function alertOnStalePRs(stalePrs: PullRequestWithRepo[]) {
  for (const pr of stalePrs) {
    // If we've already alerted, skip
    if (pr.staleAlertAt) continue;

    const message =
      `*🚨 Stale Pull Request Detected*\n` +
      `*< Pull Request | #${pr.prNumber} – ${pr.title}>*\n` +
      `> *Repo:* ${pr.repository.name}\n` +
      `> *Opened:* ${pr.openedAt.toLocaleDateString()} (${getHoursAgo(
        pr.openedAt
      )})`;

    await sendSlackAlert(message);
    await markStaleAlert(pr.id);
  }
}

export async function alertOnUnreviewedPRs(prs: PullRequestWithRepo[]) {
  for (const pr of prs) {
    // Only alert if we haven't already
    if (pr.unreviewedAlertAt) continue;

    // Safely parse the Json field
    const pendingReviewers =
      (pr.reviewers as unknown as RequestedReviewers[]) || [];

    // Extract logins/slugs for the message
    const reviewerNames =
      pendingReviewers.length > 0
        ? pendingReviewers.map((r) => `@${r.login}`).join(", ")
        : "_None assigned_";

    // Logger.info(`Pending reviewers: ${[reviewerNames]}`);
    const message =
      `*👀 PR Needs Review*\n` +
      `*< Pull Request | #${pr.prNumber} – ${pr.title}>*\n` +
      `> *Repo:* ${pr.repository.name}\n` +
      `> *Current Reviewers:* ${reviewerNames}\n` +
      `> *Status:* Awaiting first review`;

    await sendSlackAlert(message);
    await markUnreviewedAlert(pr.id);
  }
}

export async function alertOnStalledPRs(prs: PullRequestWithRepo[]) {
  for (const pr of prs) {
    if (pr.stalledAlertAt) continue;

    // Fallback for lastReviewAt to prevent getHoursAgo from crashing
    const timeAgo = pr.lastReviewAt ? getHoursAgo(pr.lastReviewAt) : "Unknown";

    // Get Pending (from reviewers field)
    const pending = (pr.reviewers as unknown as RequestedReviewers[]) || [];
    const history =
      (pr.completedReviewers as unknown as RequestedReviewers[]) || [];

    const pendingNames = pending.map((r) => "@" + r.login).join(", ") || "None";
    // Get Last Person to touch it (from completedReviewers history)
    const lastReviewer =
      history.length > 0 ? history[history.length - 1].login : "N/A";

    const str =
      lastReviewer === "N/A"
        ? "No one has reviewed this PR yet."
        : `${timeAgo} ago by *${lastReviewer}`;

    const message =
      `*🚧 PR is Stalled*\n` +
      `*< Pull Request | #${pr.prNumber} – ${pr.title}>*\n` +
      `> *Repo:* ${pr.repository.name}\n` +
      `> *Last Activity:* ${str}\n` +
      `> *Pending Reviewers:* ${pendingNames}\n` +
      `> *Action:* Please check if a follow-up is needed.`;

    await sendSlackAlert(message);
    await markStaleAlert(pr.id);
  }
}
