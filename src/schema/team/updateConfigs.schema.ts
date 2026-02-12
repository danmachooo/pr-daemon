import { z } from "zod";
import { ruleConfigSchema } from "./ruleConfig.schema";


export const updateConfigsSchema = z.object({
  configs: z.array(ruleConfigSchema).min(1),
});
