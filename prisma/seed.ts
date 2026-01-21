import { PRStatus } from "../src/generated/prisma/enums.js";
import { prisma } from "../src/lib/prisma.js";
import { onboardTeamForOwner } from "../src/services/team.service.js"; // Adjust path to your service
import { faker } from "@faker-js/faker";

async function main() {
  console.log("--- Cleaning database ---");
  await prisma.pullRequest.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log("--- Seeding Primary User ---");
  const owner = await prisma.user.create({
    data: {
      id: "user_dev_01",
      name: "Jane Doe",
      email: "jane@opscopilot.io",
      emailVerified: true,
      image: faker.image.avatar(),
    },
  });

  console.log("--- Onboarding Team via Service ---");
  // Using your service to handle team, membership, and encryption logic
  const { team } = await onboardTeamForOwner({
    ownerId: owner.id,
    name: "Core Platform Team",
    slackWebhookUrl: "https://hooks.slack.com/services/mock/webhook",
    configs: {
      stalePrDays: 3,
      autoRemind: true,
    },
    provisionGithub: true,
    baseUrl: "http://localhost:3000",
  });

  if (!team) throw new Error("Failed to onboard team");

  console.log(`Created Team: ${team.name} (ID: ${team.id})`);

  console.log("--- Seeding Repositories and PRs ---");
  const repo = await prisma.repository.create({
    data: {
      id: faker.number.int({ min: 100000, max: 999999 }),
      name: "api-gateway",
      fullName: "org/api-gateway",
      teamId: team.id,
    },
  });

  await prisma.pullRequest.createMany({
    data: [
      {
        repoId: repo.id,
        prNumber: 101,
        title: "feat: add auth middleware",
        status: PRStatus.OPEN,
        openedAt: new Date(),
        reviewCount: 1,
      },
      {
        repoId: repo.id,
        prNumber: 102,
        title: "fix: memory leak in stream",
        status: PRStatus.OPEN,
        openedAt: faker.date.recent(),
        reviewCount: 0,
      },
    ],
  });

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
