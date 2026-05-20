/* Database seed — creates a demo user. Run with `npm run db:seed`.
   Plain ESM JavaScript so it runs on any Node version without flags.
   Safe to run repeatedly (upsert). */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demo = await prisma.user.upsert({
    where: { email: "demo@voidwarframe.local" },
    update: {},
    create: {
      email: "demo@voidwarframe.local",
      name: "Demo Tenno",
      role: "ADMIN",
    },
  });
  console.log(`Seeded user: ${demo.email} (${demo.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
