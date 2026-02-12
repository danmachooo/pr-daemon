import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { TeamRole } from "../generated/prisma/enums";
import { encryptSecret } from "./secrets.service";
import { aadFor } from "../helpers/shared/aadFor.helper";
import { RuleConfig } from "../schema/team";

export async function getTeamByOwner(ownerId: string) {
  return await prisma.team.findUnique({
    where: { ownerId }, // requires @@unique([ownerId])
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      repositories: true,
    },
  });
}

export async function getTeamIdByRepo(repoId: number): Promise<number | null> {
  const repo = await prisma.repository.findUnique({
    where: { id: repoId },
    select: { teamId: true },
  });

  return repo?.teamId ?? null;
}




export async function getTeamsWithWebhook() {
  return await prisma.team.findMany({
    // only teams with configured Slack integration
    where: { slackWebhookUrlEnc: { not: null } },
    select: { id: true, slackWebhookUrlEnc: true },
  });
}

export async function getTeamByIdForOwner(teamId: number, ownerId: string) {
  return await prisma.team.findFirst({
    where: { id: teamId, ownerId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      repositories: true,
    },
  });
}

export async function createTeamForOwner(ownerId: string, name: string) {
  // Will throw P2002 if owner already has a team (due to @@unique([ownerId]))
  return await prisma.team.create({
    data: {
      name,
      ownerId,
      members: {
        create: { userId: ownerId, role: TeamRole.OWNER },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      repositories: true,
    },
  });
}

export async function updateTeamMeta(
  teamId: number,
  ownerId: string,
  data: { name?: string },
) {
  // Ownership enforcement in query
  return await prisma.team
    .update({
      where: { id: teamId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
      },
    })
    .then(async () => {
      // Return full hydrated version if you prefer
      return getTeamByIdForOwner(teamId, ownerId);
    });
}


export async function updateTeamConfigs(
  teamId: number,
  ownerId: string,
  configs: RuleConfig[],
) {
  
  const result = await prisma.team.updateMany({
    where: {
      id: teamId, ownerId
    },
    data: {
      configs
    }
  })

  if(result.count === 0) return null

  return getTeamByIdForOwner(teamId, ownerId);
}

export async function setSlackWebhook(
  teamId: number,
  ownerId: string,
  slackWebhookUrl: string,
) {
  const team = await prisma.team.findFirst({
    where: { id: teamId, ownerId },
    select: { id: true },
  });
  if (!team) return null;

  const enc = encryptSecret(slackWebhookUrl, aadFor(teamId, "slack"));

  await prisma.team.update({
    where: { id: teamId },
    data: { slackWebhookUrlEnc: enc },
  });

  return getTeamByIdForOwner(teamId, ownerId);
}

export async function provisionGithubWebhook(
  teamId: number,
  ownerId: string,
  baseUrl: string,
) {
  const team = await prisma.team.findFirst({
    where: { id: teamId, ownerId },
    select: { id: true },
  });
  if (!team) return null;

  // Strong secret generation: 32 bytes -> 64 hex chars
  const secret = crypto.randomBytes(32).toString("hex");
  const enc = encryptSecret(secret, aadFor(teamId, "github"));

  await prisma.team.update({
    where: { id: teamId },
    data: { githubWebhookSecretEnc: enc },
  });

  const payloadUrl = new URL(`/webhooks/github/${teamId}`, baseUrl).toString();

  return { payloadUrl, secret };
}

export async function updateLastGithubEvent(teamId: number) {
  return await prisma.team.update({
    where: { id: teamId },
    data: { lastGithubEventAt: new Date() },
  });
}

export async function updateLastSlackSent(teamId: number) {
  return await prisma.team.update({
    where: { id: teamId },
    data: { lastSlackSentAt: new Date() },
  });
}

export async function onboardTeamForOwner(input: {
  ownerId: string;
  name: string;
  slackWebhookUrl?: string;
  configs: RuleConfig[];
  provisionGithub: boolean;
  baseUrl: string;
}) {
  const { ownerId, name, slackWebhookUrl, configs, provisionGithub, baseUrl } =
    input;

  // Create first to get teamId (needed for AAD + payload URL)
  const created = await prisma.team.create({
    data: {
      name,
      ownerId,
      configs: configs,
      members: {
        create: { userId: ownerId, role: TeamRole.OWNER },
      },
    },
    select: { id: true },
  });

  const teamId = created.id;

  // Slack (optional)
  if (slackWebhookUrl) {
    const encSlack = encryptSecret(slackWebhookUrl, aadFor(teamId, "slack"));
    await prisma.team.update({
      where: { id: teamId },
      data: { slackWebhookUrlEnc: encSlack },
    });
  }

  // GitHub webhook provisioning (optional)
  let github: { payloadUrl: string; secret: string } | null = null;

  if (provisionGithub) {
    const secret = crypto.randomBytes(32).toString("hex");
    const encGh = encryptSecret(secret, aadFor(teamId, "github"));

    await prisma.team.update({
      where: { id: teamId },
      data: { githubWebhookSecretEnc: encGh },
    });

    const payloadUrl = new URL(
      `/webhooks/github/${teamId}`,
      baseUrl,
    ).toString();
    github = { payloadUrl, secret };
  }

  // Return hydrated team (same shape as your other reads)
  const team = await prisma.team.findFirst({
    where: { id: teamId, ownerId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      repositories: true,
    },
  });

  return { team, github };
}
