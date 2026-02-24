// src/webhooks/resolveTeam.ts

import { prisma } from "@/lib/prisma";


export async function resolveTeamFromRepoId(repoId: number) {
  const repo = await prisma.repository.findUnique({
    where: { id: repoId },
    select: {
      team: {
        select: {
          id: true,
          githubWebhookSecretEnc: true,
          slackWebhookUrlEnc: true,
        },
      },
    },
  });

  if (!repo?.team) throw new Error("Unknown repository (not linked to a team)");
  return repo.team;
}
