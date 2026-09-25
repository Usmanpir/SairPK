import Link from 'next/link';
import { BedDouble, CalendarCheck, Clock, Users, Wallet } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireManagementPage } from '@/lib/admin/guard';
import { toNumber } from '@/lib/pricing';
import { formatDate, formatPKR } from '@/lib/utils';
import { formatDateTime } from '@/lib/admin/format';
import { BOOKING_STATUSES } from '@/lib/validation/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, StatCard } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyRow, Table, Td, Th, Tr } from '@/components/admin/Table';

export const metadata = { title: 'Overview' };

export default async function AdminOverviewPage() {
  const user = await requireManagementPage();

  const [bookingsByStatus, collected, outstanding, userCount, activeUserCount, pendingHotels, recentBookings, recentActivity] =
    await Promise.all([
      prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.payment.aggregate({
        where: { status: { in: ['SUCCESS', 'PARTIALLY_REFUNDED', 'REFUNDED'] } },
        _sum: { amount: true, refundedAmount: true }
      }),
      prisma.booking.aggregate({
        where: { status: { in: ['PENDING', 'PAYMENT_PENDING'] } },
        _sum: { grandTotal: true },
        _count: { _all: true }
      }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.hotel.count({ where: { status: 'PENDING' } }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { items: { take: 1, include: { room: { select: { hotel: { select: { name: true } } } } } } }
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { actor: { select: { name: true } } }
      })
    ]);

  const statusCounts = new Map(bookingsByStatus.map((row) => [row.status, row._count._all]));
  const totalBookings = bookingsByStatus.reduce((sum, row) => sum + row._count._all, 0);
  const netCollected = toNumber(collected._sum.amount ?? 0) - toNumber(collected._sum.refundedAmount ?? 0);
  const refunded = toNumber(collected._sum.refundedAmount ?? 0);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description="Here's what's happening across bookings, payments and accounts."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net revenue collected"
          value={formatPKR(netCollected)}
          hint={refunded > 0 ? `After ${formatPKR(refunded)} refunded` : 'No refunds issued'}
          icon={<Wallet />}
        />
        <StatCard
          label="Awaiting payment"
          value={formatPKR(toNumber(outstanding._sum.grandTotal ?? 0))}
          hint={`${outstanding._count._all} unpaid booking${outstanding._count._all === 1 ? '' : 's'}`}
          icon={<Clock />}
        />
        <StatCard
          label="Total bookings"
          value={totalBookings.toLocaleString('en-PK')}
          hint={`${(statusCounts.get('PAID') ?? 0) + (statusCounts.get('CONFIRMED') ?? 0)} paid or confirmed`}
          icon={<CalendarCheck />}
        />
        <StatCard
          label="Accounts"
          value={userCount.toLocaleString('en-PK')}
          hint={`${activeUserCount} active · ${pendingHotels} hotel${pendingHotels === 1 ? '' : 's'} awaiting verification`}
          icon={<Users />}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent bookings</CardTitle>
            <Link href="/admin/bookings" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <Table>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Guest</Th>
                <Th>Stay</Th>
                <Th className="text-right">Total</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 && <EmptyRow colSpan={5}>No bookings yet.</EmptyRow>}
              {recentBookings.map((b) => {
                const item = b.items[0];
                return (
                  <Tr key={b.id}>
                    <Td>
                      <Link href={`/admin/bookings/${b.id}`} className="font-mono text-[13px] font-semibold text-primary hover:underline">
                        {b.reference}
                      </Link>
                    </Td>
                    <Td>
                      <span className="block font-medium">{b.guestName}</span>
                      <span className="block text-xs text-muted-foreground">{item?.room?.hotel.name ?? '—'}</span>
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">
                      {item ? `${formatDate(item.checkIn)} → ${formatDate(item.checkOut)}` : '—'}
                    </Td>
                    <Td className="text-right font-semibold tabular-nums">{formatPKR(toNumber(b.grandTotal))}</Td>
                    <Td>
                      <StatusBadge status={b.status} />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bookings by status</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {BOOKING_STATUSES.map((status) => (
                  <li key={status}>
                    <Link
                      href={`/admin/bookings?status=${status}`}
                      className="flex items-center justify-between rounded-lg px-2 py-1 transition-colors hover:bg-muted"
                    >
                      <StatusBadge status={status} />
                      <span className="text-sm font-semibold tabular-nums">{statusCounts.get(status) ?? 0}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Recent activity</CardTitle>
              <Link href="/admin/records" className="text-sm font-semibold text-primary hover:underline">
                All records
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No management actions recorded yet.</p>
              ) : (
                <ul className="space-y-4">
                  {recentActivity.map((a) => (
                    <li key={a.id} className="text-sm">
                      <p className="font-medium leading-snug">{a.summary}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {a.actor?.name ?? 'Deleted account'} · {formatDateTime(a.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {pendingHotels > 0 && (
            <Link
              href="/admin/hotels?status=PENDING"
              className="flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-50 p-4 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
            >
              <BedDouble className="h-5 w-5 shrink-0" />
              {pendingHotels} hotel{pendingHotels === 1 ? ' is' : 's are'} waiting for verification
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
