import { z } from "zod";
import { ruleUnitSchema } from "./ruleUnit.schema";

export const ruleConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  enabled: z.boolean(),
  threshold: z.coerce.number().int().nonnegative(),
  unit: ruleUnitSchema,
});
