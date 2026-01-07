-- AlterTable
ALTER TABLE "PullRequest" ADD COLUMN     "lastCommitAt" TIMESTAMP(3),
ADD COLUMN     "stalledAlertAt" TIMESTAMP(3);
