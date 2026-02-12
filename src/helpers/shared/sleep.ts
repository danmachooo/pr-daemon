/**
 * Pauses execution for a specified number of milliseconds.
 *
 * This utility is commonly used to:
 * - Pace external API calls (e.g. Slack webhooks)
 * - Introduce small delays between queued tasks
 * - Simulate latency in tests or workers
 *
 * IMPORTANT:
 * - This is non-blocking and does not block the event loop.
 * - It should only be used in async contexts.
 *
 * Example:
 * ```ts
 * await sleep(500);
 * ```
 *
 * @param ms - Duration to sleep in milliseconds.
 * @returns A promise that resolves after the specified delay.
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
