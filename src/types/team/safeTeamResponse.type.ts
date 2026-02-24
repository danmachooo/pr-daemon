import { Repository, TeamMember } from "@prisma/client";
import { User } from "better-auth/types";

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
