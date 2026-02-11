// Types related to Team operations

// From src/schema/team.schema.ts
export type TeamIdentifier = {
  id: number;
};

export type CreateTeamInput = {
  name: string;
};

export type UpdateTeamInput = {
  name?: string;
};

export type UpdateConfigsInput = {
  configs: Record<string, unknown>;
};

export type UpdateSlackInput = {
  slackWebhookUrl: string;
};

// From src/helpers/safeTeamResponse.ts
import { Repository, TeamMember, Team, User } from "../generated/prisma/client";

export type TeamWithRelations = Team & {
  repositories: Repository[];
  members: (TeamMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
};

export type SafeTeamResponse = {
  /** Internal team ID */
  id: number;

  /** Human-readable team name */
  name: string;

  /** Owner user ID (auth provider/user table ID depending on your system) */
  ownerId: string;

  /** Team-level configuration blob */
  configs: Record<string, unknown>;

  /** Connected GitHub org ID (if linked) */
  githubOrgId: number | null;

  /** Connected GitHub org login (if linked) */
  githubOrgLogin: string | null;

  /** Timestamp of the most recent GitHub webhook event observed (if any) */
  lastGithubEventAt: Date | null;

  /** Timestamp of the most recent Slack alert sent (if any) */
  lastSlackSentAt: Date | null;

  /** When the team was created */
  createdAt: Date;

  /** When the team was last updated */
  updatedAt: Date;

  /** Repositories currently linked to this team */
  repositories: Repository[];

  /**
   * Team members including a safe subset of user data.
   *
   * User fields are intentionally restricted to avoid leaking sensitive fields.
   */
  members: (TeamMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];

  /**
   * Secret presence flags.
   *
   * These indicate whether secrets exist without exposing the secret values.
   */
  secrets: {
    /** True if the team has a stored Slack webhook (encrypted at rest) */
    hasSlackWebhook: boolean;

    /** True if the team has a stored GitHub webhook secret (encrypted at rest) */
    hasGithubWebhookSecret: boolean;
  };
};

// From src/services/system.service.ts
export type TeamIntegrationStatus = Pick<
  Team,
  | "id"
  | "name"
  | "githubOrgId"
  | "githubOrgLogin"
  | "lastGithubEventAt"
  | "lastSlackSentAt"
  | "lastRuleRunAt"
  | "lastRuleErrorAt"
>;

export type DaemonStatus = Pick<Team, "lastRuleRunAt" | "lastRuleErrorAt">;
