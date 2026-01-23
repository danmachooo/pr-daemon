import { Logform } from "winston";
import { appConfig } from "../../config/appConfig";
import { HttpContext } from "../controllers/team.types";
import { AppError, ValidationError } from "../errors";

/**
 * Extracts and validates the `teamId` route parameter
 * from the HTTP request context.
 *
 * Behavior:
 * - Reads `teamId` from `req.params`
 * - Coerces it to a number
 * - Throws a ValidationError if the value is invalid
 *
 * This helper centralizes route-level validation
 * to keep controllers clean and consistent.
 *
 * Example:
 * ```ts
 * const teamId = getValidTeamId(ctx);
 * ```
 *
 * @param http - HTTP context containing the request object.
 * @returns A valid numeric team ID.
 *
 * @throws {ValidationError} If `teamId` is missing or not a valid number.
 */
export function getValidTeamId(http: HttpContext): number {
  const teamId = Number(http.req.params.teamId);
  console.log(teamId);

  if (!Number.isFinite(teamId)) {
    throw new ValidationError("Invalid teamId");
  }

  return teamId;
}

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
