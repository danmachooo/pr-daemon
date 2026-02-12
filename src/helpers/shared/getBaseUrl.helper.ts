import { appConfig } from "../../../config/appConfig";
import { AppError } from "../../errors";

/**
 * Returns the public base URL of the application.
 *
 * This is typically used for:
 * - OAuth callback URLs
 * - Webhook URL generation
 * - Absolute links in external integrations
 *
 * Behavior:
 * - Reads from centralized application config
 * - Fails fast if the value is missing
 *
 * @returns The configured public base URL.
 *
 * @throws {AppError} If the base URL is not configured.
 */
export function getBaseUrl(): string {
  const baseUrl = appConfig.app.url;

  if (!baseUrl) {
    throw new AppError(500, "PUBLIC_BASE_URL is not configured");
  }

  return baseUrl;
}