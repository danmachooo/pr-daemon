import type { ErrorDetails } from "./errorDetails.type";

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: ErrorDetails;
  stack?: string;
}
