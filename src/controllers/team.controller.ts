import { asyncHandler } from "../middlewares";
import type { HttpContext } from "../types/shared/httpContext.type";
import { createTeamForOwner, getTeamByIdForOwner, getTeamByOwner, onboardTeamForOwner, provisionGithubWebhook, setSlackWebhook, updateTeamConfigs, updateTeamMeta } from "../services/team.service";
import { NotFoundError } from "../errors";
import { safeTeamResponse } from "../helpers/team/safeTeamResponse.helper";
import { createTeamSchema, updateConfigsSchema, updateSlackSchema, updateTeamSchema } from "../schema/team";
import { findStalePullRequests } from "../rules/stalePr.rule";
import { findStalledPrs } from "../rules/stalledPr.rule";
import { findUnreviewedPullRequests } from "../rules/unreviewedPr.rule";
import { onboardTeamSchema } from "../schema/team/onboardTeam.schema";
import { getTeamIntegrationStatus, getDaemonStatus } from "../services/system.service";
import { getValidTeamId } from "../helpers/team/getValidTeamId.helper";
import { getBaseUrl } from "../helpers/shared/getBaseUrl.helper";
/**
 * Get the authenticated user's team
 */
export const getMyTeam = asyncHandler(async (http: HttpContext) => {
  const ownerId = http.req.user!.id;
  const team = await getTeamByOwner(ownerId);

  if (!team) throw new NotFoundError("Team not found");

  return http.res.status(200).json({
    success: true,
    team: safeTeamResponse(team),
  });
});

/**
 * Create a new team for the authenticated user
 */
export const createTeam = asyncHandler(async (http: HttpContext) => {
  const ownerId = http.req.user!.id;
  const payload = createTeamSchema.parse(http.req.body);

  const team = await createTeamForOwner(ownerId, payload.name);

  return http.res.status(201).json({
    success: true,
    message: "Team created",
    team: safeTeamResponse(team),
  });
});

/**
 * Update team metadata (name, etc.)
 */
export const updateTeam = asyncHandler(async (http: HttpContext) => {
  const ownerId = http.req.user!.id;
  const teamId = getValidTeamId(http);
  if (!teamId) return;

  const payload = updateTeamSchema.parse(http.req.body);

  const exists = await getTeamByIdForOwner(teamId, ownerId);
  if (!exists) throw new NotFoundError("Team not found");

  const team = await updateTeamMeta(teamId, ownerId, payload);

  return http.res.status(200).json({
    success: true,
    team: safeTeamResponse(team),
  });
});

/**
 * Update team configuration settings
 */
export const updateConfigs = asyncHandler(async (http: HttpContext) => {
  const ownerId = http.req.user!.id;
  const teamId = getValidTeamId(http);
  if (!teamId) return;

  const payload = updateConfigsSchema.parse(http.req.body);

  const team = await updateTeamConfigs(teamId, ownerId, payload.configs);
  if (!team) throw new NotFoundError("Team not found");

  return http.res.status(200).json({
    success: true,
    team: safeTeamResponse(team),
  });
});

/**
 * Update team Slack webhook URL
 */
export const updateTeamSlackWebhook = asyncHandler(
  async (http: HttpContext) => {
    const ownerId = http.req.user!.id;
    const teamId = getValidTeamId(http);
    if (!teamId) return;

    const payload = updateSlackSchema.parse(http.req.body);

    const team = await setSlackWebhook(
      teamId,
      ownerId,
      payload.slackWebhookUrl,
    );

    if (!team) throw new NotFoundError("Team not found");

    return http.res.status(200).json({
      success: true,
      team: safeTeamResponse(team),
    });
  },
);

/**
 * Provision GitHub webhook for the team
 */
export const createTeamGithubWebhook = asyncHandler(
  async (http: HttpContext) => {
    const ownerId = http.req.user!.id;
    const teamId = getValidTeamId(http);
    if (!teamId) return;

    const team = await getTeamByIdForOwner(teamId, ownerId);
    if (!team) throw new NotFoundError("Team not found");

    const baseUrl = getBaseUrl();
    if (!baseUrl) return;

    const result = await provisionGithubWebhook(teamId, ownerId, baseUrl);
    if (!result) throw new NotFoundError("Team not found");

    return http.res.status(201).json({
      success: true,
      payloadUrl: result.payloadUrl,
      webhookSecret: result.secret,
      note: "Copy this secret now. It will not be shown again.",
    });
  },
);

/**
 * Complete team onboarding (create team + setup integrations)
 */
export const onboardTeam = asyncHandler(async (http: HttpContext) => {
  const ownerId = http.req.user!.id;
  const payload = onboardTeamSchema.parse(http.req.body);

  const baseUrl = getBaseUrl();
  if (!baseUrl) return;

  const { team, github } = await onboardTeamForOwner({
    ownerId,
    name: payload.name,
    slackWebhookUrl: payload.slackWebhookUrl,
    configs: payload.configs ?? {},
    provisionGithub: payload.provisionGithub ?? true,
    baseUrl,
  });

  if (!team) {
    // This is an internal failure, not "not found"
    return http.res.status(500).json({
      success: false,
      message: "Failed to create team",
    });
  }

  return http.res.status(201).json({
    success: true,
    message: "Onboarding complete",
    team: safeTeamResponse(team),
    ...(github && {
      github: {
        payloadUrl: github.payloadUrl,
        webhookSecret: github.secret,
        note: "Copy this secret now. It will not be shown again.",
      },
    }),
  });
});

export const getSystemStatus = asyncHandler(async (http: HttpContext) => {
  const ownerId = http.req.user!.id;

  const team = await getTeamByOwner(ownerId);
  if (!team) throw new NotFoundError("Team not found");

  const teamId = team.id;
  const {
    lastGithubEventAt,
    lastSlackSentAt,
    slackWebhookUrlEnc,
    githubWebhookSecretEnc,
  } = await getTeamIntegrationStatus(teamId);
  const { lastRuleRunAt, lastRuleErrorAt } = await getDaemonStatus(teamId);

  const githubConnected = githubWebhookSecretEnc !== null;

  return http.res.status(200).json({
    success: true,
    integrations: {
      github: {
        connected: githubConnected,
        lastEventAt: lastGithubEventAt,
      },
      slack: {
        configured: Boolean(slackWebhookUrlEnc),
        lastAlertSentAt: lastSlackSentAt,
      },
    },
    daemon: {
      lastRunAt: lastRuleRunAt,
      lastErrorAt: lastRuleErrorAt,
    },
  });
});

export const getPRStatus = asyncHandler(async (http: HttpContext) => {
  const ownerId = http.req.user!.id;

  const team = await getTeamByOwner(ownerId);
  if (!team) throw new NotFoundError("Team not found");

  const teamId = team.id;

  // Parse query params
  const sortOrder = (http.req.query.sort as "latest" | "oldest") || "latest";
  const limit = http.req.query.limit
    ? parseInt(http.req.query.limit as string)
    : 1;

  const [stalePRs, unreviewedPrs, stalledPrs] = await Promise.all([
    findStalePullRequests(teamId, { sortOrder, limit }),
    findUnreviewedPullRequests(teamId, { sortOrder, limit }),
    findStalledPrs(teamId, { sortOrder, limit }),
  ]);

  http.res.status(200).json({
    success: true,
    stale: stalePRs,
    unreviewed: unreviewedPrs,
    stalled: stalledPrs,
    timestamp: new Date().toISOString(),
  });
});
