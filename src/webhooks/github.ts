// src/webhooks/github.ts
import { Request, Response } from "express";
import {
  resetPullRequest,
  upsertPullRequest,
} from "../services/pullRequest.service";
import { PRStatus } from "../generated/prisma/enums";
export const githubWebhookHandler = async (req: Request, res: Response) => {
  const event = req.headers["x-github-event"];
  // We only care about pull_request events
  if (event !== "pull_request") {
    return res.status(200).json({ message: "Event ignored", ignored: true });
  }

  const { action, pull_request, repository } = req.body;

  if (action === "closed") {
    await resetPullRequest({
      repoId: repository.id,
      prNumber: pull_request.number,
      closedAt: pull_request.closedAt,
    });
  }
  if (!pull_request || !repository) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const status =
    pull_request.state === "open" ? PRStatus.OPEN : PRStatus.CLOSED;

  await upsertPullRequest({
    repoId: repository.id,
    repoName: repository.name,
    prNumber: pull_request.number,
    title: pull_request.title,
    status,
    openedAt: new Date(pull_request.openedAt),
    closedAt: pull_request.closed_at ? new Date(pull_request.closed_at) : null,
  });
  return res.status(200).json({ stored: true });
};
