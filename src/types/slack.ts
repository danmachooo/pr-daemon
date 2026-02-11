// Types related to Slack operations

// From src/services/slack.service.ts
export interface SlackAlertOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  webhookUrl?: string

}

export interface SlackAlertResult {
  success: boolean;
  attempts: number
  error?: string;
}
