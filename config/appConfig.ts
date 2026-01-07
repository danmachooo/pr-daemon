import { env } from "./env";

export const appConfig = {
  app: {
    port: Number(env.port),
    _24hr: 24 * 60 * 60 * 1000,
    node_env: env.node_env,
    stale_days_threshold: Number(env.stale_days_default),

    stall_hours_threshold: 48,
    slack_webhook_url: env.slack_webhook_url,
  },
  db_url: env.db_url,
};
