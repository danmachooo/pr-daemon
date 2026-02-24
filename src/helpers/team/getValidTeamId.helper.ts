import { ValidationError } from "@/errors";
import { HttpContext } from "@/types/shared";

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
