import { RequestedReviewer } from "@/schema/github/webhook";
import { sendSlackAlert } from "@/services/slack.service";
import { SlackAlertResult } from "@/types/slack";
import { enqueueWebhook } from "@/utils/slackQueue";
import { getHoursAgo } from "../shared/hoursAgo.helper";
import { sleep } from "../shared/sleep";


/**
 * Safely parses a "reviewers" JSON field into a list of reviewers.
 *
 * This is intended for values coming from untyped sources (e.g. Prisma Json fields,
 * webhook payloads, or serialized history fields).
 *
 * Notes:
 * - This function does not validate shape; it only coerces to the expected type.
 * - If `reviewers` is null/undefined/invalid, it returns an empty array.
 *
 * @param reviewers - Unknown value that is expected to contain reviewer objects.
 * @returns A list of reviewers, or an empty list if missing.
 */
export function parseReviewers(reviewers: unknown): RequestedReviewer[] {
  return (reviewers as RequestedReviewer[]) || [];
}

/**
 * Formats reviewer handles for Slack.
 *
 * Example output:
 * - "@alice, @bob"
 * - "_None assigned_" (when empty)
 *
 * @param reviewers - List of requested reviewers.
 * @returns A Slack-friendly string representing the reviewers.
 */
export function formatReviewerNames(reviewers: RequestedReviewer[]): string {
  if (reviewers.length === 0) return "_None assigned_";
  return reviewers.map((r) => `@${r.login}`).join(", ");
}

/**
 * Extracts the last reviewer from a completed reviewers history field.
 *
 * This is useful for displaying "last activity by X" style messages
 * for stalled PR alerts.
 *
 * @param completedReviewers - Unknown value expected to be a reviewer history array.
 * @returns The last reviewer's login, or "N/A" if unavailable.
 */
export function getLastReviewer(completedReviewers: unknown): string {
  const history = parseReviewers(completedReviewers);
  return history.length > 0
    ? (history[history.length - 1].login ?? "N/A")
    : "N/A";
}

/**
 * Creates a human-readable "last activity" description for stalled PR alerts.
 *
 * Behavior:
 * - If there is no known reviewer, returns a friendly message indicating no reviews yet.
 * - If a reviewer exists but `lastReviewAt` is null, uses "Unknown" time.
 *
 * @param lastReviewAt - Timestamp of the last review activity (if known).
 * @param lastReviewer - Username/login of the last reviewer (or "N/A").
 * @returns Slack-friendly last activity summary string.
 */
export function formatLastActivity(
  lastReviewAt: Date | null,
  lastReviewer: string,
): string {
  if (lastReviewer === "N/A") {
    return "No one has reviewed this PR yet.";
  }

  const timeAgo = lastReviewAt ? getHoursAgo(lastReviewAt) : "Unknown";
  return `${timeAgo} ago by *${lastReviewer}`;
}

/**
 * Formats a Slack link block for a pull request.
 *
 * NOTE:
 * This uses Slack's link formatting style. The actual URL is expected
 * to be injected by Slack/your alert renderer depending on your implementation.
 *
 * @param prNumber - Pull request number.
 * @param title - Pull request title.
 * @returns A Slack-formatted PR link line.
 */
export function formatPRLink(prNumber: number, title: string): string {
  return `*< Pull Request | #${prNumber} – ${title}>*`;
}

/**
 * Formats the opened date string including a relative "hours ago" suffix.
 *
 * Example output:
 * - "1/23/2026 (5h ago)"
 *
 * @param openedAt - The pull request creation date.
 * @returns A human-friendly date string for Slack alerts.
 */
export function formatOpenedDate(openedAt: Date): string {
  return `${openedAt.toLocaleDateString()} (${getHoursAgo(openedAt)})`;
}

/**
 * Sends a Slack alert through a per-webhook queue to preserve ordering
 * and reduce rate-limit bursts.
 *
 * Behavior:
 * - Serializes sends per `slackWebhookUrl` using {@link enqueueWebhook}.
 * - Adds a small delay after sending to pace requests (basic rate limiting).
 *
 * @param slackWebhookUrl - The decrypted Slack incoming webhook URL.
 * @param message - Slack message payload (string) to dispatch.
 * @returns The Slack alert result including status/attempt metadata.
 */
export async function sendQueued(
  slackWebhookUrl: string,
  message: string,
): Promise<SlackAlertResult> {
  return enqueueWebhook(slackWebhookUrl, async () => {
    const res = await sendSlackAlert(message, { webhookUrl: slackWebhookUrl });
    await sleep(500); // pacing
    return res;
  });
}
