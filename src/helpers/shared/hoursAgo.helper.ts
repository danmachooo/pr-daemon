import Logger from "@/utils/logger";

/**
 * Calculates the time difference between the current moment
 * and a past timestamp, returning a human-readable string.
 *
 * Accepted input types:
 * - `Date` object
 * - ISO date string
 * - Unix timestamp (milliseconds)
 *
 * Behavior:
 * - Returns a friendly relative time string (e.g. "2 hours ago")
 * - Returns "less than an hour ago" if under 1 hour
 * - Logs an error and returns `null` if the input date is invalid
 *
 * This function is intended for UI-facing messages
 * such as Slack alerts, dashboards, and logs.
 *
 * Example outputs:
 * - "less than an hour ago"
 * - "1 hour ago"
 * - "5 hours ago"
 *
 * @param pastTime - A past date or timestamp to compare against now.
 * @returns A human-readable relative time string, or `null` if invalid.
 */
export function getHoursAgo(
  pastTime: Date | string | number,
): string | null {
  const pastDate = new Date(pastTime);

  // Validate the date
  if (isNaN(pastDate.getTime())) {
    Logger.error(
      `Invalid date value provided to getHoursAgo: ${pastTime}`,
    );
    return null;
  }

  const now = new Date();
  const millisecondsAgo = now.getTime() - pastDate.getTime();

  // 1 hour = 3,600,000 ms
  const millisecondsInHour = 1000 * 60 * 60;
  const hoursAgo = Math.floor(
    millisecondsAgo / millisecondsInHour,
  );

  // Handle pluralization for better UX
  if (hoursAgo < 1) {
    return "less than an hour ago";
  }

  return hoursAgo === 1
    ? "1 hour ago"
    : `${hoursAgo} hours ago`;
}
