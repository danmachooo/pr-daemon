import type { Team, Repository, TeamMember, User } from "../../generated/prisma/client";

export type TeamWithRelations = Team & {
  repositories: Repository[];
  members: (TeamMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
};

