import { Router } from "express";
import {
  createTeam,
  getMyTeam,
  onboardTeam,
  createTeamGithubWebhook,
  updateConfigs,
  updateTeamSlackWebhook,
  updateTeam,
  getSystemStatus,
  getPRStatus,
} from "../controllers/team.controller";
import { requireAuth } from "../middlewares/requireAuth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/onboard", onboardTeam);

router.get("/me", getMyTeam);
router.get("/system/status", getSystemStatus);
router.get("/pr/status", getPRStatus);

router.post("/", createTeam);

router.patch("/:teamId", updateTeam);
router.patch("/:teamId/configs", updateConfigs);
router.patch("/:teamId/slack", updateTeamSlackWebhook);
router.post("/:teamId/github/webhook", createTeamGithubWebhook);

export default router;
