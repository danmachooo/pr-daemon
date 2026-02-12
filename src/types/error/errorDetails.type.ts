import type { PrismaUniqueConstraintErrors } from "./prismaUniqueConstraintError.type";
import type { ZodErrors } from "./zodError.type";


export type ErrorDetails = ZodErrors | PrismaUniqueConstraintErrors;
