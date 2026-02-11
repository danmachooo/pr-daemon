import axios, { AxiosError } from "axios";
import Logger from "../utils/logger";
import type { SlackAlertOptions, SlackAlertResult } from "../types/slack";

export type { SlackAlertResult };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function sendSlackAlert(
  message: string,
  options: SlackAlertOptions,
): Promise<SlackAlertResult> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 5000,
    webhookUrl,
  } = options;

  if (!message || message.trim().length === 0) {
    Logger.error("Slack alert failed: Empty message provided");
    return { success: false, error: "Empty message provided", attempts: 0 };
  }

  if (!webhookUrl) {
    Logger.error("Slack alert failed: Webhook URL not configured");
    return { success: false, error: "Webhook URL not configured", attempts: 0 };
  }

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await axios.post(
        webhookUrl,
        { text: message },
        { timeout, headers: { "Content-Type": "application/json" } },
      );

      if (attempt > 1) {
        Logger.info(`Slack alert sent successfully on attempt ${attempt}`);
      }

      return { success: true, attempts: attempt };
    } catch (error) {
      lastError = error as Error;
      const isLastAttempt = attempt === maxRetries;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        Logger.error(`Slack alert attempt ${attempt}/${maxRetries} failed:`, {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          message: axiosError.message,
          code: axiosError.code,
        });

        const status = axiosError.response?.status;

        // ✅ Handle 429 properly (honor Retry-After)
        if (status === 429 && !isLastAttempt) {
          const retryAfterHeader =
            axiosError.response?.headers?.["retry-after"] ??
            axiosError.response?.headers?.["Retry-After"];

          const retryAfterSec = Number(retryAfterHeader);
          const waitMs =
            Number.isFinite(retryAfterSec) && retryAfterSec > 0
              ? retryAfterSec * 1000
              : retryDelay * Math.pow(2, attempt - 1);

          Logger.warn("Slack rate limited (429). Retrying after delay.", {
            attempt,
            waitMs,
          });

          await sleep(waitMs);
          continue;
        }

        // Don't retry on 4xx errors (except 429)
        if (status && status >= 400 && status < 500 && status !== 429) {
          Logger.error("Slack alert failed with client error, not retrying");
          break;
        }
      } else {
        Logger.error(
          `Slack alert attempt ${attempt}/${maxRetries} failed:`,
          error,
        );
      }

      // Exponential backoff for non-429 retryable failures
      if (!isLastAttempt) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  const errorMessage =
    lastError instanceof Error ? lastError.message : "Unknown error";

  Logger.error(
    `Slack alert failed after ${maxRetries} attempts: ${errorMessage}`,
  );

  return { success: false, error: errorMessage, attempts: maxRetries };
}
