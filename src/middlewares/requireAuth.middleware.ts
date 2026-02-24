import { toFetchHeaders } from "@/helpers/shared/toFetchHeaders.helper";
import { auth } from "@/lib/auth";
import { NextFunction, Request, Response } from "express";

/**
 * Authentication middleware that enforces a valid user session.
 *
 * This middleware integrates with Better Auth to:
 * - Validate the incoming request session
 * - Extract the authenticated user ID
 * - Attach the user to `req.user` for downstream handlers
 *
 * Behavior:
 * - Converts Express headers into Fetch-compatible headers
 *   using {@link toFetchHeaders}
 * - Calls Better Auth's `getSession` API
 * - Responds with HTTP 401 if authentication fails
 *
 * On success:
 * - `req.user` is populated with `{ id: string }`
 * - Request continues to the next middleware/handler
 *
 * Example usage:
 * ```ts
 * router.get(
 *   "/teams/:teamId",
 *   requireAuth,
 *   asyncHandler(async ({ req, res }) => {
 *     res.json({ userId: req.user.id });
 *   }),
 * );
 * ```
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 *
 * @returns A JSON 401 response if unauthorized, otherwise calls `next()`.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // NOTE: Adjust API name if your Better Auth instance differs
    const session = await auth.api.getSession({
      headers: toFetchHeaders(req.headers),
    });

    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Attach authenticated user context for downstream handlers
    req.user = { id: session.user.id };

    return next();
  } catch {
    // Fail closed: any error results in unauthorized
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}
