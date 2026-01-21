import { faker } from "@faker-js/faker";
import { prisma } from "../src/lib/prisma";
import { PRStatus } from "../src/generated/prisma/enums";
import { onboardTeamForOwner } from "../src/services/team.service";
import { appConfig } from "../config/appConfig"; // adjust path if needed

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}
function daysAgo(d: number) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}
function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60 * 1000);
}

export async function main() {
  console.log("--- Cleaning database ---");
  await prisma.pullRequest.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log("--- Seeding Users and Teams ---");

  const teamContexts = [
    {
      name: "Core Platform",
      ownerEmail: "jane@opscopilot.io",
      id: "user_dev_01",
    },
    { name: "Frontend UI", ownerEmail: "bob@opscopilot.io", id: "user_dev_02" },
    {
      name: "Data Engine",
      ownerEmail: "alice@opscopilot.io",
      id: "user_dev_03",
    },
    {
      name: "Security Ops",
      ownerEmail: "charlie@opscopilot.io",
      id: "user_dev_04",
    },
  ];

  // use the same rule thresholds your finders use
  const staleDays = appConfig.thresholds.staleDays;
  const stallHours = appConfig.thresholds.stallHours;

  const unreviewedCutoffDays = 1; // your service uses msPerDay (1 day)

  for (const ctx of teamContexts) {
    const owner = await prisma.user.create({
      data: {
        id: ctx.id,
        name: faker.person.fullName(),
        email: ctx.ownerEmail,
        emailVerified: true,
        image: faker.image.avatar(),
      },
    });

    const { team } = await onboardTeamForOwner({
      ownerId: owner.id,
      name: ctx.name,
      slackWebhookUrl: `https://hooks.slack.com/services/mock/${faker.string.alphanumeric(10)}`,
      configs: {
        stalePrDays: faker.number.int({ min: 2, max: 7 }),
        autoRemind: true,
      },
      provisionGithub: true,
      baseUrl: "http://localhost:3000",
    });

    if (!team) continue;
    console.log(`Created Team: ${team.name} (ID: ${team.id})`);

    const repoCount = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < repoCount; i++) {
      const repoName = faker.helpers
        .slugify(faker.commerce.productName())
        .toLowerCase();

      const repo = await prisma.repository.create({
        data: {
          id: faker.number.int({ min: 100000, max: 999999 }),
          name: repoName,
          fullName: `org/${repoName}`,
          teamId: team.id,
        },
      });

      const basePrNumber = faker.number.int({ min: 1000, max: 9000 });

      const prs = [
        // ✅ HEALTHY - should NOT match any rule
        {
          repoId: repo.id,
          prNumber: basePrNumber + 1,
          title: `[healthy] ${faker.git.commitMessage()}`,
          status: PRStatus.OPEN,
          openedAt: daysAgo(Math.max(0, staleDays - 1)),
          lastCommitAt: minutesAgo(30),
          lastReviewAt: minutesAgo(45),
          reviewCount: 1,
          staleAlertAt: null,
          stalledAlertAt: null,
        },

        // ❌ STALE - matches findStalePullRequests
        {
          repoId: repo.id,
          prNumber: basePrNumber + 2,
          title: `[violate stale] ${faker.git.commitMessage()}`,
          status: PRStatus.OPEN,
          openedAt: daysAgo(staleDays + 2),
          lastCommitAt: daysAgo(staleDays + 1),
          lastReviewAt: daysAgo(staleDays + 1),
          reviewCount: faker.number.int({ min: 0, max: 2 }),
          staleAlertAt: null,
          stalledAlertAt: null,
        },

        // ❌ STALE but already alerted (still returned by your finder, but worker can skip)
        {
          repoId: repo.id,
          prNumber: basePrNumber + 3,
          title: `[stale already alerted] ${faker.git.commitMessage()}`,
          status: PRStatus.OPEN,
          openedAt: daysAgo(staleDays + 3),
          lastCommitAt: daysAgo(staleDays + 2),
          lastReviewAt: daysAgo(staleDays + 2),
          reviewCount: faker.number.int({ min: 0, max: 2 }),
          staleAlertAt: minutesAgo(10),
          stalledAlertAt: null,
        },

        // ❌ UNREVIEWED - matches findUnreviewedPullRequests
        {
          repoId: repo.id,
          prNumber: basePrNumber + 4,
          title: `[violate unreviewed] ${faker.git.commitMessage()}`,
          status: PRStatus.OPEN,
          openedAt: daysAgo(unreviewedCutoffDays + 2),
          lastCommitAt: daysAgo(2),
          lastReviewAt: null,
          reviewCount: 0,
          staleAlertAt: null,
          stalledAlertAt: null,
        },

        // ❌ STALLED Case 1 - matches findStalledPrs
        // reviewCount > 0 AND lastCommitAt <= threshold AND lastReviewAt <= threshold
        {
          repoId: repo.id,
          prNumber: basePrNumber + 5,
          title: `[violate stalled case1] ${faker.git.commitMessage()}`,
          status: PRStatus.OPEN,
          openedAt: daysAgo(3),
          lastCommitAt: hoursAgo(stallHours + 5),
          lastReviewAt: hoursAgo(stallHours + 5),
          reviewCount: faker.number.int({ min: 1, max: 3 }),
          staleAlertAt: null,
          stalledAlertAt: null,
        },

        // 🚫 STALLED Case 1 but already alerted (should NOT be returned by findStalledPrs)
        {
          repoId: repo.id,
          prNumber: basePrNumber + 6,
          title: `[stalled case1 already alerted] ${faker.git.commitMessage()}`,
          status: PRStatus.OPEN,
          openedAt: daysAgo(4),
          lastCommitAt: hoursAgo(stallHours + 10),
          lastReviewAt: hoursAgo(stallHours + 10),
          reviewCount: faker.number.int({ min: 1, max: 3 }),
          staleAlertAt: null,
          stalledAlertAt: minutesAgo(20),
        },

        // ❌ STALLED Case 2 - matches findStalledPrs
        // reviewCount = 0 AND openedAt <= threshold AND lastCommitAt <= threshold
        {
          repoId: repo.id,
          prNumber: basePrNumber + 7,
          title: `[violate stalled case2] ${faker.git.commitMessage()}`,
          status: PRStatus.OPEN,
          openedAt: hoursAgo(stallHours + 8),
          lastCommitAt: hoursAgo(stallHours + 8),
          lastReviewAt: null,
          reviewCount: 0,
          staleAlertAt: null,
          stalledAlertAt: null,
        },

        // ✅ CLOSED - should not match any OPEN-only finder
        {
          repoId: repo.id,
          prNumber: basePrNumber + 8,
          title: `[closed] ${faker.git.commitMessage()}`,
          status: PRStatus.CLOSED,
          openedAt: daysAgo(staleDays + 10),
          lastCommitAt: daysAgo(staleDays + 9),
          lastReviewAt: daysAgo(staleDays + 9),
          reviewCount: faker.number.int({ min: 0, max: 3 }),
          staleAlertAt: null,
          stalledAlertAt: null,
        },
      ];

      await prisma.pullRequest.createMany({ data: prs });
    }
  }

  console.log("Seeding finished successfully! 🌱");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
