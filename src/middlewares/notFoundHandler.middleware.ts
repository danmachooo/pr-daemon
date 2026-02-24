import { NotFoundError } from "@/errors";
import { Request, Response, NextFunction } from "express";

/**
 * Catch-all middleware for handling unknown routes (404).
 *
 * This middleware should be registered:
 * - AFTER all valid routes
 * - BEFORE the global error handler
 *
 * It converts unmatched requests into a structured
 * `NotFoundError`, allowing the centralized error handler
 * to format and log the response consistently.
 *
 * Example registration order:
 * ```ts
 * app.use(routes);
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 * ```
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function used to forward the error.
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);

  next(error);
}
