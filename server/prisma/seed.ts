import { prisma } from "../src/db";
import { hashPassword } from "better-auth/crypto";
import { Role } from "../src/generated/prisma/client";

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;

if (!email || !password) {
  console.error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
  process.exit(1);
}

if (password.length < 12) {
  console.error("SEED_ADMIN_PASSWORD must be at least 12 characters");
  process.exit(1);
}

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.log(`Admin user already exists: ${email}`);
  process.exit(0);
}

const hashedPassword = await hashPassword(password);
const id = crypto.randomUUID();

await prisma.user.create({
  data: {
    id,
    name: "Admin",
    email,
    role: Role.admin,
  },
});

await prisma.account.create({
  data: {
    id: crypto.randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: hashedPassword,
  },
});

console.log(`Admin user created: ${email}`);
process.exit(0);
