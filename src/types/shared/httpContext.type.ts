import type { Request, Response } from "express";

export type HttpContext = {
  req: Request;
  res: Response;
};