import { AppError } from "./AppError";
/**
 * Error representing a resource conflict.
 *
 * Typically thrown when an operation would violate
 * a uniqueness constraint or attempt to create a resource
 * that already exists.
 *
 * Maps to HTTP status code 409 (Conflict).
 *
 * Common use cases:
 * - Duplicate record creation
 * - Unique constraint violations
 * - Conflicting state transitions
 *
 * Example:
 * ```ts
 * throw new ConflictError("Team with this name already exists");
 * ```
 */
export class ConflictError extends AppError {
  /**
   * Creates a new ConflictError.
   *
   * @param message - Optional custom error message.
   *                  Defaults to "Resource already exists".
   */
  constructor(message: string = "Resource already exists") {
    super(409, message);
  }
}
