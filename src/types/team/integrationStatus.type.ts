import type { Team } from "../../generated/prisma/client";

export type TeamIntegrationStatus = Pick<
  Team,
  | "lastGithubEventAt"
  | "lastSlackSentAt"
  | "lastRuleRunAt"
  | "lastRuleErrorAt"
>;