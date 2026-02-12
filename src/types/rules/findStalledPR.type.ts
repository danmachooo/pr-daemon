import type { SortOrder } from "../shared/sortOrder.type";

export interface FindUnreviewedPullRequestsOptions {
  sortOrder?: SortOrder;
  limit?: number;
}
