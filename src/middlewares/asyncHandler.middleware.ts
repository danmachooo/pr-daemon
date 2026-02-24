import { HttpContext } from "@/types/shared";
import { Request, Response,NextFunction } from "express";

/**
 * Wraps an asynchronous route handler to automatically
 * forward rejected promises and thrown errors to Express'
 * error-handling middleware.
 *
 * This utility eliminates repetitive `try/catch` blocks
 * in controllers and ensures consistent error propagation.
 *
 * Design:
 * - Controllers receive a single `HttpContext` object
 * - Errors are passed to `next()` for centralized handling
 *
 * Example:
 * ```ts
 * router.get(
 *   "/teams/:teamId",
 *   asyncHandler(async ({ req, res }) => {
 *     const team = await getTeam(req.params.teamId);
 *     res.json(team);
 *   }),
 * );
 * ```
 *
 * @param fn - Asynchronous route handler accepting an `HttpContext`.
 * @returns An Express-compatible request handler.
 */
export const asyncHandler =
  (fn: (http: HttpContext) => Promise<void | unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn({ req, res })).catch(next);
  };
