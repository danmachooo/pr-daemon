import { Team } from "@prisma/client";

export type DaemonStatus = Pick<Team, "lastRuleRunAt" | "lastRuleErrorAt">;
