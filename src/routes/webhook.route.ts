// src/routes.ts
import { githubWebhookHandler } from "@/webhooks/github";
import { Router } from "express";
import express from "express";

const router = Router();

router.post(
  "/github",
  express.raw({ type: "application/json" }),
  githubWebhookHandler
);

export default router;
