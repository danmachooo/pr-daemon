import z from "zod";

// 1. Re-export the schemas so other files can use them directly
export * from "./teamIdentifier.schema";
export * from "./createTeam.schema";
export * from "./updateConfigs.schema";
export * from "./updateSlack.schema";
export * from "./updateTeam.schema";
export * from './ruleConfig.schema'
export * from './ruleUnit.schema'

// 2. Import them locally to create the types
import { teamIdentifierSchema } from "./teamIdentifier.schema";
import { createTeamSchema } from "./createTeam.schema";
import { updateConfigsSchema } from "./updateConfigs.schema";
import { updateSlackSchema } from "./updateSlack.schema";
import { updateTeamSchema } from "./updateTeam.schema";
import { ruleUnitSchema } from "./ruleUnit.schema";
import { ruleConfigSchema } from "./ruleConfig.schema";


// 3. Export the Types
export type TeamIdentifier = z.infer<typeof teamIdentifierSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type UpdateConfigsInput = z.infer<typeof updateConfigsSchema>;
export type UpdateSlackInput = z.infer<typeof updateSlackSchema>;
export type RuleConfig = z.infer<typeof ruleConfigSchema>
export type RuleUnit = z.infer<typeof ruleUnitSchema>
