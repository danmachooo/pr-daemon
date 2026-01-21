import { prisma } from "../lib/prisma";
import type { Team } from "../generated/prisma/client";

export type TeamIntegrationStatus = Pick<
  Team,
  "lastGithubEventAt" | "lastSlackSentAt"
>;

export type DaemonStatus = Pick<Team, "lastRuleRunAt" | "lastRuleErrorAt">;

export async function updateLastRuleRunAt(
  teamId: number,
): Promise<Pick<Team, "lastRuleRunAt">> {
  return prisma.team.update({
    where: {
      id: teamId,
    },
    data: {
      lastRuleRunAt: new Date(),
    },
    select: {
      lastRuleRunAt: true,
    },
  });
}

export async function updateLastRuleErrorAt(
  teamId: number,
): Promise<Pick<Team, "lastRuleErrorAt">> {
  return prisma.team.update({
    where: {
      id: teamId,
    },
    data: {
      lastRuleErrorAt: new Date(),
    },
    select: {
      lastRuleErrorAt: true,
    },
  });
}

export async function bulkUpdateLastRuleRunAt(teamIds: number[]) {
  if (teamIds.length === 0) return;

  return prisma.team.updateMany({
    where: {
      id: { in: teamIds },
    },
    data: {
      lastRuleRunAt: new Date(),
    },
  });
}

export async function bulkUpdateLastRuleErrorAt(teamIds: number[]) {
  if (teamIds.length === 0) return;

  return prisma.team.updateMany({
    where: {
      id: { in: teamIds },
    },
    data: {
      lastRuleErrorAt: new Date(),
    },
  });
}

export async function getDaemonStatus(teamId: number): Promise<DaemonStatus> {
  return await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    select: {
      lastRuleRunAt: true,
      lastRuleErrorAt: true,
    },
  });
}

export async function getTeamIntegrationStatus(
  teamId: number,
): Promise<TeamIntegrationStatus> {
  return prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    select: {
      lastGithubEventAt: true,
      lastSlackSentAt: true,
    },
  });
}
