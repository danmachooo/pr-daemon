// Common types used across the application

import { Request, Response } from "express";

// From src/controllers/team.types.ts
export type HttpContext = {
  req: Request;
  res: Response;
};

// From src/middlewares/errorHandler.ts
export interface ErrorResponse {
  success: false;
  message: string;
  error?: any;
}
