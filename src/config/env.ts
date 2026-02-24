import "dotenv/config";
import { z } from "zod";

/**
 * Zod schema defining all required and optional
 * environment variables for the application.
 *
 * Responsibilities:
 * - Validate presence and shape of env vars
 * - Apply defaults where appropriate
 * - Coerce types (e.g. strings → numbers)
 *
 * IMPORTANT:
 * - Any variable defined here is required at runtime
 *   unless a default is explicitly provided.
 * - Secrets must never be logged.
 */
const envSchema = z.object({
  /** Port the HTTP server will bind to */
  PORT: z.coerce.number().default(3000),

  /** Public base URL of the application */
  BASE_URL: z.string().min(1),

  /**
   * Runtime environment.
   *
   * Affects:
   * - Logging verbosity
   * - Error handling
   * - Feature toggles
   */
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  /** Database connection string */
  DATABASE_URL: z.string().min(1),

  /**
   * Default number of days before a PR
   * is considered stale.
   */
  STALE_DAYS_DEFAULT: z.coerce.number().positive().default(3),

  /** Default Slack webhook URL */
  SLACK_WEBHOOK_URL: z.string().min(1),

  /** Secret used by Better Auth for signing tokens */
  BETTER_AUTH_SECRET: z.string().min(1),

  /** Public URL registered with Better Auth */
  BETTER_AUTH_URL: z.string().min(1),

  /** GitHub OAuth client ID */
  GITHUB_CLIENT_ID: z.string().min(1),

  /** GitHub OAuth client secret */
  GITHUB_CLIENT_SECRET: z.string().min(1),

  /**
   * Hex-encoded encryption key(s).
   *
   * Expected usage:
   * - Parsed into 32-byte buffers for AES-256-GCM
   * - May support key rotation (comma-separated)
   */
  SECRET_KEYS_HEX: z.string().min(1),
});

/**
 * Validates and parses environment variables
 * using the defined Zod schema.
 *
 * Behavior:
 * - Reads from `process.env`
 * - Applies defaults and coercions
 * - Fails fast on startup if validation fails
 *
 * On failure:
 * - Logs all invalid variables with reasons
 * - Throws an error to prevent the app from starting
 *
 * @returns A fully validated, typed environment object
 *
 * @throws {Error} If any required environment variable is missing or invalid
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");

    parsed.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    });

    // Fail fast — app should not run with invalid config
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

/**
 * Validated, immutable environment configuration.
 *
 * This should be imported instead of accessing `process.env`
 * directly to ensure:
 * - Type safety
 * - Runtime guarantees
 * - Early failure on misconfiguration
 */
export const env = validateEnv();
