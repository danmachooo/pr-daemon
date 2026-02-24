import z from "zod";
import { completedReviewRecordSchema } from "./completeReviewRecord.schema";
import { githubEventTypeSchema } from "./githubEventType.schema";
import { pullRequestEventSchema } from "./prEvent.schema";
import { pullRequestReviewEventSchema } from "./prReviewEvent.schema";
import { requestedReviewerSchema } from "./requestedReviewer.schema";

export type GitHubEventType = z.infer<typeof githubEventTypeSchema>
export type PullRequestEvent = z.infer<typeof pullRequestEventSchema>
export type PullRequestReviewEvent = z.infer<typeof pullRequestReviewEventSchema>;

export type RequestedReviewer = z.infer<typeof requestedReviewerSchema>
export type CompletedReviewRecord = z.infer<typeof completedReviewRecordSchema>;
export type ReviewState = CompletedReviewRecord["state"];