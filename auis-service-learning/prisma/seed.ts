import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Matches the current email: Sept 1 2025 - Feb 1 2026, deadline May 10 2026 3PM.
  // Student Services (or you) can add the next semester the same way,
  // and flip isActive so only one semester accepts new entries at a time.
  await prisma.semester.upsert({
    where: { name: "Fall 2025" },
    update: {},
    create: {
      name: "Fall 2025",
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-02-01T23:59:59Z"),
      deadline: new Date("2026-05-10T15:00:00Z"),
      isActive: true,
    },
  });
  console.log("Seeded Fall 2025 semester.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
