import { appConfig } from "../../config/appConfig";
import { HttpContext } from "../controllers/team.types";
import { AppError, ValidationError } from "../errors";

// Helper to validate teamId parameter
export function getValidTeamId(http: HttpContext): number {
  const teamId = Number(http.req.params.teamId);

  if (!Number.isFinite(teamId)) {
    throw new ValidationError("Invalid teamID");
  }

  return teamId;
}

export function getBaseUrl(): string {
  const baseUrl = appConfig.app.url;

  if (!baseUrl) {
    throw new AppError(500, "PUBLIC_BASE_URL is not configured");
  }

  return baseUrl;
}
