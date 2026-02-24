import { Team } from "@prisma/client";

export type TeamIntegrationStatus = Pick<
  Team,
  | "lastGithubEventAt"
  | "lastSlackSentAt"
  | "lastRuleRunAt"
  | "lastRuleErrorAt"
>;