/**
 * Playwright global setup: ensures test users exist with known passwords.
 *
 * Writes a small Bun script to a temp file and executes it in the server
 * directory so it has access to the Prisma client and Better Auth's
 * hashPassword utility.
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import path from "path";
import os from "os";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../server/.env") });

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@helpdesk.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "password1234!";
const AGENT_EMAIL = process.env.SEED_AGENT_EMAIL ?? "agent@helpdesk.com";
const AGENT_PASSWORD = process.env.SEED_AGENT_PASSWORD ?? "password1234!";

const serverDir = path.resolve(__dirname, "../server");

function upsertUser(opts: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "agent";
}): void {
  const script = `
import { PrismaClient } from './src/generated/prisma/client.ts';
import { hashPassword } from 'better-auth/crypto';

const prisma = new PrismaClient();
const email = "${opts.email}";
const password = "${opts.password}";
const name = "${opts.name}";
const role = "${opts.role}";

try {
  const hashed = await hashPassword(password);
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (!existing) {
    const id = crypto.randomUUID();
    await prisma.user.create({
      data: {
        id, name, email, role,
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: id,
            providerId: 'credential',
            password: hashed,
          },
        },
      },
    });
    console.log('[setup] Created user: ' + email);
  } else {
    const cred = existing.accounts.find((a) => a.providerId === 'credential');
    if (cred) {
      await prisma.account.update({ where: { id: cred.id }, data: { password: hashed } });
    } else {
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          accountId: existing.id,
          providerId: 'credential',
          userId: existing.id,
          password: hashed,
        },
      });
    }
    await prisma.user.update({ where: { email }, data: { name, role } });
    console.log('[setup] Ensured user: ' + email);
  }
} finally {
  await prisma.$disconnect();
}
`;

  const tmpFile = path.join(serverDir, `_pw-setup-${Date.now()}.ts`);
  try {
    writeFileSync(tmpFile, script, "utf8");
    execSync(`bun run ${tmpFile}`, {
      cwd: serverDir,
      stdio: "inherit",
      env: { ...process.env },
    });
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

export default async function globalSetup() {
  upsertUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: "Admin", role: "admin" });
  upsertUser({ email: AGENT_EMAIL, password: AGENT_PASSWORD, name: "Agent", role: "agent" });
}
