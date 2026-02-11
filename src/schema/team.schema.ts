import { z } from "zod";

export const teamIdentifierSchema = z.object({
  id: z.number(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
});

export const updateConfigsSchema = z.object({
  configs: z.record(z.string(), z.unknown()),
});

export const updateSlackSchema = z.object({
  slackWebhookUrl: z
    .string()
    .url("Invalid URL")
    .refine(
      (u) => u.startsWith("https://hooks.slack.com/services/"),
      "Invalid Slack webhook URL",
    ),
});

export const onboardTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  slackWebhookUrl: z
    .string()
    .url("Slack webhook must be a valid URL")
    .optional(),
  configs: z.record(z.string(), z.unknown()).optional().default({}),
  provisionGithub: z.boolean().optional().default(true),
});

export const provisionGithubWebhookSchema = z.object({});

// Types are now exported from src/types/team.ts
export type {
  TeamIdentifier,
  CreateTeamInput,
  UpdateTeamInput,
  UpdateConfigsInput,
  UpdateSlackInput,
} from "../types/team";
