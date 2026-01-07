import { startCronJobs } from "./jobs/cron";
import Logger from "./utils/logger";

/**
 * Automatically starts the cron worker and handles basic
 * process events for reliability.
 */
(async function initializeWorker() {
  try {
    Logger.info("🧠 OpsCopilot cron worker starting...");

    // Initialize your jobs
    await startCronJobs();

    Logger.info("✅ OpsCopilot cron worker is running");
  } catch (error: any) {
    Logger.error(`❌ Failed to start worker: ${error.message}`);
    process.exit(1);
  }

  // Handle graceful shutdown (e.g., when stopping the server)
  process.on("SIGTERM", () => {
    Logger.info("Stopping cron worker...");
    process.exit(0);
  });
})();
