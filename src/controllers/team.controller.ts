import { Request, Response } from "express";
import { z } from "zod";
import {
  createTeamSchema,
  updateTeamSchema,
  updateConfigsSchema,
  updateSlackSchema,
  onboardTeamSchema,
} from "../schema/team.schema";
import Logger from "../utils/logger";
import {
  createTeamForOwner,
  getTeamByOwner,
  provisionGithubWebhook,
  setSlackWebhook,
  updateTeamConfigs,
  updateTeamMeta,
  getTeamByIdForOwner,
  onboardTeamForOwner,
} from "../services/team.service";
import { appConfig } from "../../config/appConfig";
import { safeTeamResponse } from "../helpers/safeTeamResponse";

export async function getMyTeam(req: Request, res: Response) {
  try {
    const ownerId = req.user!.id;
    const team = await getTeamByOwner(ownerId);

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    return res.status(200).json({
      success: true,
      team: safeTeamResponse(team),
    });
  } catch (err) {
    Logger.error("Error fetching team:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch team" });
  }
}

export async function createTeam(req: Request, res: Response) {
  try {
    const ownerId = req.user!.id;
    const payload = createTeamSchema.parse(req.body);

    const team = await createTeamForOwner(ownerId, payload.name);

    return res.status(201).json({
      success: true,
      message: "Team created",
      team: safeTeamResponse(team),
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues,
      });
    }

    // Prisma unique constraint (ownerId unique)
    if (err?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This user already has a team (one team per owner).",
      });
    }

    Logger.error("Error creating team:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create team" });
  }
}

export async function updateTeam(req: Request, res: Response) {
  try {
    const ownerId = req.user!.id;
    const teamId = Number(req.params.teamId);

    if (!Number.isFinite(teamId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid teamId" });
    }

    const payload = updateTeamSchema.parse(req.body);

    const exists = await getTeamByIdForOwner(teamId, ownerId);
    if (!exists)
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });

    const team = await updateTeamMeta(teamId, ownerId, payload);
    return res
      .status(200)
      .json({ success: true, team: safeTeamResponse(team) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues,
      });
    }
    Logger.error("Error updating team:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update team" });
  }
}

export async function updateConfigs(req: Request, res: Response) {
  try {
    const ownerId = req.user!.id;
    const teamId = Number(req.params.teamId);

    if (!Number.isFinite(teamId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid teamId" });
    }

    const payload = updateConfigsSchema.parse(req.body);

    const team = await updateTeamConfigs(teamId, ownerId, payload.configs);
    if (!team)
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });

    return res
      .status(200)
      .json({ success: true, team: safeTeamResponse(team) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues,
      });
    }
    Logger.error("Error updating configs:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update configs" });
  }
}

export async function updateSlack(req: Request, res: Response) {
  try {
    const ownerId = req.user!.id;
    const teamId = Number(req.params.teamId);

    if (!Number.isFinite(teamId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid teamId" });
    }

    const payload = updateSlackSchema.parse(req.body);

    const team = await setSlackWebhook(
      teamId,
      ownerId,
      payload.slackWebhookUrl,
    );
    if (!team)
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });

    return res
      .status(200)
      .json({ success: true, team: safeTeamResponse(team) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues,
      });
    }
    Logger.error("Error updating slack webhook:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update slack webhook" });
  }
}

export async function provisionGithub(req: Request, res: Response) {
  try {
    const ownerId = req.user!.id;
    const teamId = Number(req.params.teamId);

    if (!Number.isFinite(teamId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid teamId" });
    }

    const team = await getTeamByIdForOwner(teamId, ownerId);
    if (!team)
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });

    const baseUrl = appConfig.app.url;
    if (!baseUrl) {
      return res
        .status(500)
        .json({ success: false, message: "Missing PUBLIC_BASE_URL" });
    }

    const result = await provisionGithubWebhook(teamId, ownerId, baseUrl);
    if (!result)
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });

    // Important: secret is shown once
    return res.status(201).json({
      success: true,
      payloadUrl: result.payloadUrl,
      webhookSecret: result.secret,
      note: "Copy this secret now. It will not be shown again.",
    });
  } catch (err) {
    Logger.error("Error provisioning github webhook:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to provision github webhook" });
  }
}
export async function onboardTeam(req: Request, res: Response) {
  try {
    const ownerId = req.user!.id;
    const payload = onboardTeamSchema.parse(req.body);

    const baseUrl = appConfig.app.url;
    if (!baseUrl) {
      return res
        .status(500)
        .json({ success: false, message: "Missing PUBLIC_BASE_URL" });
    }

    const { team, github } = await onboardTeamForOwner({
      ownerId,
      name: payload.name,
      slackWebhookUrl: payload.slackWebhookUrl,
      configs: payload.configs ?? {},
      provisionGithub: payload.provisionGithub ?? true,
      baseUrl,
    });

    if (!team) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to create team" });
    }

    return res.status(201).json({
      success: true,
      message: "Onboarding complete",
      team: safeTeamResponse(team),
      ...(github
        ? {
            github: {
              payloadUrl: github.payloadUrl,
              webhookSecret: github.secret,
              note: "Copy this secret now. It will not be shown again.",
            },
          }
        : {}),
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues,
      });
    }

    if (err?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This user already has a team (one team per owner).",
      });
    }

    Logger.error("Error onboarding team:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to complete onboarding",
    });
  }
}
