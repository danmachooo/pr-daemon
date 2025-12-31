import "dotenv/config";

export const env = {
  port: process.env.PORT || 3000,
  node_env: process.env.NODE_ENV || "development",
  db_url: process.env.DATABASE_URL || "No database url.",
  stale_days_default: process.env.STALE_DAYS_DEFAULT || 3,
  slack_webhook_url: process.env.SLACK_WEBHOOK_URL || "No slack webhook",
};
