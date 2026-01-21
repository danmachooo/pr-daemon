import axios, { AxiosError } from "axios";
import Logger from "../utils/logger";

interface SlackAlertOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  webhookUrl: string;
}

interface SlackAlertResult {
  success: boolean;
  error?: string;
  attempts: number;
}

export async function sendSlackAlert(
  message: string,
  options: SlackAlertOptions,
): Promise<SlackAlertResult> {
  const { maxRetries = 3, retryDelay = 1000, timeout = 5000 } = options;

  // Validate inputs
  if (!message || message.trim().length === 0) {
    Logger.error("Slack alert failed: Empty message provided");
    return {
      success: false,
      error: "Empty message provided",
      attempts: 0,
    };
  }

  if (!options.webhookUrl) {
    Logger.error("Slack alert failed: Webhook URL not configured");
    return {
      success: false,
      error: "Webhook URL not configured",
      attempts: 0,
    };
  }

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await axios.post(
        options.webhookUrl,
        { text: message },
        {
          timeout,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      // Success
      if (attempt > 1) {
        Logger.info(`Slack alert sent successfully on attempt ${attempt}`);
      }

      return {
        success: true,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error as Error;
      const isLastAttempt = attempt === maxRetries;

      // Log the error
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        Logger.error(`Slack alert attempt ${attempt}/${maxRetries} failed:`, {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          message: axiosError.message,
          code: axiosError.code,
        });

        // Don't retry on 4xx errors (except 429 rate limit)
        if (
          axiosError.response?.status &&
          axiosError.response.status >= 400 &&
          axiosError.response.status < 500 &&
          axiosError.response.status !== 429
        ) {
          Logger.error("Slack alert failed with client error, not retrying");
          break;
        }
      } else {
        Logger.error(
          `Slack alert attempt ${attempt}/${maxRetries} failed:`,
          error,
        );
      }

      // Wait before retrying (exponential backoff)
      if (!isLastAttempt) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  const errorMessage =
    lastError instanceof Error ? lastError.message : "Unknown error";

  Logger.error(
    `Slack alert failed after ${maxRetries} attempts: ${errorMessage}`,
  );

  return {
    success: false,
    error: errorMessage,
    attempts: maxRetries,
  };
}
