import { z } from "zod";

export const ruleUnitSchema = z.enum(["minutes", "hours", "days"])