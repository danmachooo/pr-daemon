import Logger from "../utils/logger";

/**
 * Calculates the difference between now and a past date,
 * returning a human-readable string.
 */
export function getHoursAgo(pastTime: Date | string | number): string | null {
  const pastDate = new Date(pastTime);

  // Validate the date
  if (isNaN(pastDate.getTime())) {
    Logger.error(`Invalid date value provided to getHoursAgo: ${pastTime}`);
    return null;
  }

  const now = new Date();
  const millisecondsAgo = now.getTime() - pastDate.getTime();

  // 1 hour = 3,600,000 ms
  const millisecondsInHour = 1000 * 60 * 60;
  const hoursAgo = Math.floor(millisecondsAgo / millisecondsInHour);

  // Handle pluralization for better UI
  if (hoursAgo < 1) {
    return "less than an hour ago";
  }

  return hoursAgo === 1 ? "1 hour ago" : `${hoursAgo} hours ago`;
}
