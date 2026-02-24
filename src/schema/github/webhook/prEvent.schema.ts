import { userSchema } from "better-auth/db";
import z from "zod";
import { pullRequestSchema } from "./pr.schema";
import { repositorySchema } from "./repository.schema";
import { teamSchema } from "./team.schema";


export const pullRequestEventSchema = z.object({
  action: z.enum([
    "opened",
    "closed",
    "reopened",
    "synchronize",
    "edited",
    "assigned",
    "unassigned",
    "review_requested",
    "review_request_removed",
    "labeled",
    "unlabeled",
  ]),
  number: z.coerce.number(),
  pull_request: pullRequestSchema,
  repository: repositorySchema,
  sender: userSchema,
  requested_reviewer: z.union([userSchema, teamSchema]).optional(),
});

