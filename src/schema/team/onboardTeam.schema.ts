import z from "zod";    
import { ruleConfigSchema } from "./ruleConfig.schema";

export const onboardTeamSchema = z.object({
  name: z.coerce.string().min(1, "Team name is required"),
  slackWebhookUrl: z.string()
    .trim()
    .url({ message: "Slack webhook must be a valid URL" }) 
    .optional()
    .or(z.literal("")),
  configs: z.array(ruleConfigSchema).min(1),
  provisionGithub: z.boolean().optional().default(true),
});