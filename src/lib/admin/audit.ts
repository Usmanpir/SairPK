import type { Prisma, PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

/** Records a management action. Pass the transaction client to keep it atomic with the change. */
export function logAudit(
  db: Db,
  entry: { actorId: string; action: string; entityType: string; entityId: string; summary: string }
) {
  return db.auditLog.create({ data: entry });
}
