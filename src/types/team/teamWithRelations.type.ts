import { Team, Repository, TeamMember } from "@prisma/client";
import { User } from "better-auth/types";

export type TeamWithRelations = Team & {
  repositories: Repository[];
  members: (TeamMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
};

