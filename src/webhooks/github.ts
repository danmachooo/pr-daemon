// src/webhooks/github.ts
import { updateLastGithubEvent } from "@/services/team.service";
import { Request, Response } from "express";
import { handlePullRequestEvent, handlePullRequestReviewEvent } from "./handlers/pullRequest.handler";
import { resolveTeamFromRepoId } from "./resolveTeam";
import { verifyGithubWebhookSignature } from "./verifyGithub";


export const githubWebhookHandler = async (req: Request, res: Response) => {
  try {
    const event = req.headers["x-github-event"] as string | undefined;
    const signature256 = req.headers["x-hub-signature-256"] as
      | string
      | undefined;

    const rawBody = req.body as Buffer; // because express.raw()
    const payload = JSON.parse(rawBody.toString("utf8"));

    const repoId = payload?.repository?.id;
    if (!repoId)
      throw new Error("Missing repository.id in GitHub webhook payload");

    const team = await resolveTeamFromRepoId(repoId);

    await verifyGithubWebhookSignature({
      githubWebhookSecretEnc: team.githubWebhookSecretEnc,
      rawBody,
      signature256,
    });

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
    await updateLastGithubEvent(team.id);

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: (err as Error).message,
    });
  }
};
