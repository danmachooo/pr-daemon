import { getHoursAgo } from "../helpers/hoursAgo";
import { markStaleAlert, markUnreviewedAlert } from "./pullRequest.service";
import { sendSlackAlert } from "./slack.service";

export async function alertOnStalePRs(stalePrs: any[]) {
  for (const pr of stalePrs) {
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

export async function alertOnUnreviewedPRs(prs: any[]) {
  for (const pr of prs) {
    const message =
      `*👀 PR Needs Review*\n` +
      `*< Pull Request | #${pr.prNumber} – ${pr.title}>*\n` +
      `> *Repo:* ${pr.repository.name}\n` +
      `> *Status:* Awaiting first review`;

    await sendSlackAlert(message);
    await markUnreviewedAlert(pr.id);
  }
}

export async function alertOnStalledPRs(prs: any[]) {
  for (const pr of prs) {
    const message =
      `*🚧 PR is Stalled*\n` +
      `*< Pull Request | #${pr.prNumber} – ${pr.title}>*\n` +
      `> *Repo:* ${pr.repository.name}\n` +
      `> *Last Activity:* Reviewed ${getHoursAgo(pr.lastReviewAt)}\n` +
      `> *Action:* Author needs to address feedback.`;

    await sendSlackAlert(message);
  }
}
