# TODO: Reorganize Types into src/types/

## Steps to Complete

1. **Create src/types/team.ts**
   - Move TeamIdentifier, CreateTeamInput, UpdateTeamInput, UpdateConfigsInput, UpdateSlackInput from src/schema/team.schema.ts
   - Move TeamWithRelations, SafeTeamResponse from src/helpers/safeTeamResponse.ts
   - Move TeamIntegrationStatus, DaemonStatus from src/services/system.service.ts

2. **Create src/types/webhook.ts**
   - Move PullRequestEvent, PullRequestReviewEvent, GitHubEventType, RequestedReviewer from src/schema/webhook.schema.ts

3. **Create src/types/pullRequest.ts**
   - Move PullRequestWithRepo, PullRequestIdentifier, UpsertPullRequest, ClosePullRequestInput from src/services/pullRequest.types.ts
   - Move SortOrder from src/rules/*.rule.ts (unreviewedPr.rule.ts, stalledPr.rule.ts, stalePr.rule.ts)
   - Move FindUnreviewedPullRequestsOptions, FindStalledPrsOptions, FindStalePullRequestsOptions from rules

4. **Create src/types/slack.ts**
   - Move SlackAlertOptions, SlackAlertResult from src/services/slack.service.ts

5. **Create src/types/common.ts**
   - Move HttpContext from src/controllers/team.types.ts
   - Move ErrorResponse from src/middlewares/errorHandler.ts

6. **Update Schema Files**
   - Modify src/schema/team.schema.ts to export types from src/types/team.ts
   - Modify src/schema/webhook.schema.ts to export types from src/types/webhook.ts

7. **Update Imports Across Codebase**
   - Update all files importing these types to use the new locations
   - Use search_files to find all usages and update them

8. **Remove Old Type Definitions**
   - Delete type definitions from original files after moving

9. **Verify and Test**
   - Ensure no compilation errors
   - Check for any missed types or imports
