// Promotes an existing, email-verified account to admin. Use it once to create the first
// admin on a fresh deployment (instead of seeding demo accounts with a known password).
//
//   npm run make-admin -- you@college.edu
//
// Runs against whatever DATABASE_URL is set (your .env, or one you pass inline).
import { PrismaClient } from "@prisma/client";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: npm run make-admin -- you@college.edu");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, emailVerifiedAt: true } });

  if (!user) {
    console.error(`No account for ${email}. Sign up in the app and confirm the email first.`);
    process.exitCode = 1;
  } else if (!user.emailVerifiedAt) {
    console.error(`${email} hasn't confirmed its email yet. Confirm it first, then run this again.`);
    process.exitCode = 1;
  } else if (user.role === "ADMIN") {
    console.log(`${email} is already an admin.`);
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    console.log(`${email} is now an admin (was ${user.role.toLowerCase()}). Reload the app to see Admin tools.`);
  }
} finally {
  await prisma.$disconnect();
}
