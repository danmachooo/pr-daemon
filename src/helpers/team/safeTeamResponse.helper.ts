import type { TeamWithRelations, SafeTeamResponse } from "../../types/team";

/**
 * Converts a Team record (with relations) into a safe API response object.
 *
 * This function:
 * - Returns `null` if the input team is `null`
 * - Copies public fields directly
 * - Ensures relation arrays always exist
 * - Converts encrypted secret fields into boolean presence flags only
 *
 * Typical usage:
 * ```ts
 * const team = await prisma.team.findUnique({
 *   where: { id },
 *   include: { repositories: true, members: { include: { user: true } } },
 * });
 *
 * return safeTeamResponse(team);
 * ```
 *
 * @param team - Team model with required relations loaded, or null.
 * @returns Safe, client-facing Team response, or null if no team was provided.
 */
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
