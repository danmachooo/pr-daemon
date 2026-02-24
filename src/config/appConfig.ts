import { env } from "./env";

/**
 * Number of milliseconds in one day.
 *
 * Used for time-based calculations such as
 * PR age, alert windows, and cleanup jobs.
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Default number of hours before a pull request
 * is considered "stalled".
 */
const STALL_HOURS = 48;

/**
 * Maximum number of alerts that can be sent
 * per team within a given evaluation window.
 *
 * Acts as a safety cap to prevent alert spam.
 */
const MAX_ALERTS_PER_TEAM = 20;

/**
 * Cryptographic algorithm used for symmetric encryption.
 *
 * AES-256-GCM provides:
 * - Confidentiality
 * - Integrity
 * - Authenticity (via auth tag)
 */
const ALGO = "aes-256-gcm";

/**
 * Length of the initialization vector (IV) in bytes.
 *
 * 12 bytes is the NIST-recommended length for AES-GCM.
 */
const IV_LEN = 12;

/**
 * Length of the authentication tag in bytes.
 *
 * 16 bytes (128 bits) is standard for AES-GCM.
 */
const TAG_LEN = 16;

/**
 * Centralized application configuration.
 *
 * This object is immutable (`as const`) and intended to be:
 * - Imported directly (no mutation)
 * - Used as the single source of truth for app-wide settings
 *
 * All values originate from validated environment variables.
 */
export const appConfig = {
  /**
   * Core application settings.
   */
  app: {
    /** Port the HTTP server listens on */
    port: env.PORT,

    /** Public base URL of the application */
    url: env.BASE_URL,

    /** Current runtime environment (development | production | test) */
    nodeEnv: env.NODE_ENV,

    /** Milliseconds per day constant */
    msPerDay: MS_PER_DAY,

    /** Alert rate cap per team */
    maxAlertsPerTeam: MAX_ALERTS_PER_TEAM,
  },

  /**
   * Encryption configuration used across the application.
   *
   * These values must remain consistent for both
   * encryption and decryption.
   */
  encryption: {
    /** Symmetric encryption algorithm */
    algo: ALGO,

    /** Initialization Vector length (bytes) */
    iv_len: IV_LEN,

    /** Authentication tag length (bytes) */
    tag_Len: TAG_LEN,
  },

  /**
   * Thresholds used by the rule engine
   * to determine PR health.
   */
  thresholds: {
    /** Number of days before a PR is considered stale */
    staleDays: env.STALE_DAYS_DEFAULT,

    /** Number of hours before a PR is considered stalled */
    stallHours: STALL_HOURS,
  },

  /**
   * Database configuration.
   */
  database: {
    /** Database connection URL */
    url: env.DATABASE_URL,
  },

  /**
   * Third-party integrations.
   */
  integrations: {
    /** Default Slack webhook URL (optional / legacy use) */
    slackWebhookUrl: env.SLACK_WEBHOOK_URL,
  },

  /**
   * Authentication and OAuth configuration.
   */
  auth: {
    /** Secret used by Better Auth for signing tokens */
    secret: env.BETTER_AUTH_SECRET,

    /** Public URL used by Better Auth */
    url: env.BETTER_AUTH_URL,

    /**
     * GitHub OAuth credentials.
     */
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },

  /**
   * Application secrets.
   *
   * These values should never be logged or exposed.
   */
  secrets: {
    /**
     * Hex-encoded encryption key(s).
     *
     * Expected usage:
     * - Derived into 32-byte buffers for AES-256-GCM
     * - May support key rotation in the future
     */
    key_hex: env.SECRET_KEYS_HEX,
  },
} as const;
