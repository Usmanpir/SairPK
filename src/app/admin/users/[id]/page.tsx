import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireManagementPage } from '@/lib/admin/guard';
import { formatDateTime } from '@/lib/admin/format';
import { assignableRoles, canManageRole, ROLE_LABELS } from '@/lib/roles';
import { toNumber } from '@/lib/pricing';
import { formatDate, formatPKR } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { ActiveBadge, StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyRow, Table, Td, Th, Tr } from '@/components/admin/Table';
import { AccountAccessControls, EditUserForm } from '@/components/admin/UserForms';

export const metadata = { title: 'Account' };

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const actor = await requireManagementPage();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      passwordHash: true,
      hotels: { select: { id: true, name: true, status: true } },
      bookings: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, reference: true, status: true, grandTotal: true, createdAt: true }
      }
    }
  });
  if (!user) notFound();

  const history = await prisma.auditLog.findMany({
    where: { entityType: 'User', entityId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { actor: { select: { name: true } } }
  });

  const isSelf = actor.id === user.id;
  const canManage = canManageRole(actor.role, user.role);
  const canEdit = isSelf || canManage;

  return (
    <>
      <PageHeader
        back={{ href: '/admin/users', label: 'All accounts' }}
        title={user.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge>{ROLE_LABELS[user.role]}</Badge>
            <ActiveBadge active={user.isActive} />
            {!user.passwordHash && <Badge variant="outline">Guest checkout — no password</Badge>}
            <span>Joined {formatDate(user.createdAt)}</span>
          </span>
        }
      />

      {!canEdit && (
        <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Only a Super Admin can edit {ROLE_LABELS[user.role]} accounts. You can view this account but not change it.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
            </CardHeader>
            <CardContent>
              <EditUserForm
                user={{ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive }}
                roles={assignableRoles(actor.role)}
                isSelf={isSelf}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>Most recent 20 bookings made by this account.</CardDescription>
            </CardHeader>
            <Table>
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {user.bookings.length === 0 && <EmptyRow colSpan={4}>No bookings yet.</EmptyRow>}
                {user.bookings.map((b) => (
                  <Tr key={b.id}>
                    <Td>
                      <Link href={`/admin/bookings/${b.id}`} className="font-mono text-[13px] font-semibold text-primary hover:underline">
                        {b.reference}
                      </Link>
                    </Td>
                    <Td className="text-muted-foreground">{formatDate(b.createdAt)}</Td>
                    <Td className="text-right font-semibold tabular-nums">{formatPKR(toNumber(b.grandTotal))}</Td>
                    <Td>
                      <StatusBadge status={b.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {user.hotels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Managed hotels</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {user.hotels.map((h) => (
                    <li key={h.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                      <span className="font-medium">{h.name}</span>
                      <StatusBadge status={h.status} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Access</CardTitle>
              </CardHeader>
              <CardContent>
                <AccountAccessControls userId={user.id} isActive={user.isActive} isSelf={isSelf} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No changes made from the dashboard yet.</p>
              ) : (
                <ul className="space-y-4">
                  {history.map((h) => (
                    <li key={h.id} className="text-sm">
                      <p className="font-medium">{h.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.actor?.name ?? 'Deleted account'} · {formatDateTime(h.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                Last updated {formatDateTime(user.updatedAt)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
