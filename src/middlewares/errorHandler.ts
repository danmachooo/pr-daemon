import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Logger from "../utils/logger";
import { AppError } from "../errors";
import { Prisma } from "../generated/prisma/client";
import { appConfig } from "../../config/appConfig";

interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
  stack?: string;
}

const isDevelopment = appConfig.app.nodeEnv === "development";

/**
 * Global error handler middleware
 * Must be registered AFTER all routes
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: any = undefined;

  // --- Zod validation errors ---
  if (err instanceof z.ZodError) {
    statusCode = 400;
    message = "Validation error";
    errors = err.issues;
  }

  // --- Custom AppError instances ---
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // --- Prisma errors (reliable detection) ---
  else if (isPrismaKnownRequestError(err)) {
    const prismaError = handlePrismaKnownError(err);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    errors = prismaError.errors;
  }

  // --- JWT errors ---
  else if (err instanceof Error && err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err instanceof Error && err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // --- Multer errors ---
  else if (err instanceof Error && err.name === "MulterError") {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  }

  // Log error details
  const errObj = err instanceof Error ? err : new Error(String(err));

  if (statusCode >= 500) {
    Logger.error("Server error:", {
      message: errObj.message,
      stack: errObj.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  } else {
    Logger.warn("Client error:", {
      message: errObj.message,
      statusCode,
      url: req.url,
      method: req.method,
    });
  }

  const response: ErrorResponse = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(isDevelopment && { stack: errObj.stack }),
  };

  return res.status(statusCode).json(response);
}

/**
 * Strong Prisma detection:
 * - PrismaClientKnownRequestError is what contains codes like P2002, P2025, etc.
 */
function isPrismaKnownRequestError(
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError;
}

/**
 * Prisma known error mapper
 * Customize P2002 for your "one team per owner" constraint
 */
function handlePrismaKnownError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  errors?: any;
} {
  switch (err.code) {
    case "P2002": {
      const target = err.meta?.target;

      // target sometimes is string[] or string depending on Prisma version/adapter
      const fields = Array.isArray(target)
        ? target
        : target
          ? [String(target)]
          : [];
      const joined = fields.length ? fields.join(", ") : "field";

      // ✅ Custom message for "one team per owner"
      // If your unique constraint is on ownerId or (ownerId) in Team table
      if (fields.includes("ownerId")) {
        return {
          statusCode: 409,
          message: "This user already has a team (one team per owner).",
          errors: { fields },
        };
      }

      return {
        statusCode: 409,
        message: `A record with this ${joined} already exists`,
        errors: { fields },
      };
    }

    case "P2025":
      return {
        statusCode: 404,
        message: "Record not found",
      };

    case "P2003":
      return {
        statusCode: 400,
        message: "Invalid reference: related record does not exist",
      };

    case "P2014":
      return {
        statusCode: 400,
        message: "The change violates a required relation",
      };

    default:
      return {
        statusCode: 500,
        message: "Database error occurred",
      };
  }
}
