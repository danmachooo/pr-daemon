import { ReviewState } from "@/schema/github/webhook"

export type ReviewData = {
  reviewId: number
  reviewerId: number
  reviewerLogin: string
  state: ReviewState,
  submittedAt?: string
}
