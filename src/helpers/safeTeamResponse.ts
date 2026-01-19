import { Repository, TeamMember, Team, User } from "../generated/prisma/client";

// Helper type for the included relations
type TeamWithRelations = Team & {
  repositories: Repository[];
  members: (TeamMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
};

export type SafeTeamResponse = {
  id: number;
  name: string;
  ownerId: string;
  configs: Record<string, unknown>;
  githubOrgId: number | null;
  githubOrgLogin: string | null;
  lastGithubEventAt: Date | null;
  lastSlackSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  repositories: Repository[];
  members: (TeamMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
  secrets: {
    hasSlackWebhook: boolean;
    hasGithubWebhookSecret: boolean;
  };
};

export function safeTeamResponse(
  team: TeamWithRelations | null,
): SafeTeamResponse | null {
  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    ownerId: team.ownerId,
    configs: team.configs as Record<string, unknown>,
    githubOrgId: team.githubOrgId,
    githubOrgLogin: team.githubOrgLogin,
    lastGithubEventAt: team.lastGithubEventAt,
    lastSlackSentAt: team.lastSlackSentAt,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    repositories: team.repositories ?? [],
    members: team.members ?? [],
    secrets: {
      hasSlackWebhook: Boolean(team.slackWebhookUrlEnc),
      hasGithubWebhookSecret: Boolean(team.githubWebhookSecretEnc),
    },
  };
}
