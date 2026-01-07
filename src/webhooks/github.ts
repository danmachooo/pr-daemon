// src/webhooks/github.ts
import { Request, Response } from "express";
import {
  handlePullRequestEvent,
  handlePullRequestReviewEvent,
} from "./handlers/pullRequest.handler";
export const githubWebhookHandler = async (req: Request, res: Response) => {
  const event = req.headers["x-github-event"];
  const payload = req.body;

  switch (event) {
    case "pull_request":
      await handlePullRequestEvent(payload);
      break;

    case "pull_request_review":
      await handlePullRequestReviewEvent(payload);
      break;

    default:
      return res.status(200).json({ ignored: true });
  }

  return res.status(200).json({ ok: true });
};
