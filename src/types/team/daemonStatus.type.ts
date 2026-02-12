import type { Team } from "../../generated/prisma/client";

export type DaemonStatus = Pick<Team, "lastRuleRunAt" | "lastRuleErrorAt">;
