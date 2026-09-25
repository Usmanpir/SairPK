import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEMO_ACCOUNTS } from '../src/lib/demo-accounts';

/** Idempotently creates (or refreshes) every demo login account. */
export async function seedDemoUsers(prisma: PrismaClient) {
  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, role: account.role, passwordHash, isActive: true },
      create: { email: account.email, name: account.name, role: account.role, passwordHash }
    });
  }
}

export function logDemoUsers() {
  for (const a of DEMO_ACCOUNTS) {
    console.log(`Demo login (${a.label}) — ${a.email} / ${a.password}`);
  }
}

// Allow running on its own: `npm run db:seed:users` (safe to re-run; touches users only).
if (require.main === module) {
  const prisma = new PrismaClient();
  seedDemoUsers(prisma)
    .then(() => {
      console.log('Demo users seeded.');
      logDemoUsers();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
