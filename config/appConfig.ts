import { env } from "./env";

export const appConfig = {
  app: {
    port: Number(env.port),
    node_env: env.node_env,
    stale_days: Number(env.stale_days_default),
    slack_webhook_url: env.slack_webhook_url,
  },
  db_url: env.db_url,
};
