import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireManagementPage } from '@/lib/admin/guard';
import { PAGE_SIZE, param, parsePage, pick } from '@/lib/admin/format';
import { toNumber } from '@/lib/pricing';
import { formatDate, formatPKR } from '@/lib/utils';
import { BOOKING_STATUSES } from '@/lib/validation/admin';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/admin/FilterBar';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyRow, Table, Td, Th, Tr } from '@/components/admin/Table';

export const metadata = { title: 'Bookings' };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminBookingsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireManagementPage();

  const q = param(searchParams.q);
  const status = pick(param(searchParams.status), BOOKING_STATUSES);
  const page = parsePage(searchParams.page);

  const where: Prisma.BookingWhereInput = {
    ...(status && { status }),
    ...(q && {
      OR: [
        { reference: { contains: q, mode: 'insensitive' } },
        { guestName: { contains: q, mode: 'insensitive' } },
        { guestEmail: { contains: q, mode: 'insensitive' } },
        { guestPhone: { contains: q } }
      ]
    })
  };

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        payment: { select: { status: true, amount: true, refundedAmount: true } },
        items: { take: 1, include: { room: { select: { name: true, hotel: { select: { name: true } } } } } }
      }
    })
  ]);

  return (
    <>
      <PageHeader title="Bookings" description="Review, update and cancel reservations across every hotel." />

      <Card className="overflow-hidden">
        <FilterBar
          basePath="/admin/bookings"
          q={q}
          placeholder="Search reference, guest name, email or phone"
          selects={[{ name: 'status', label: 'Statuses', value: status ?? '', options: BOOKING_STATUSES }]}
        />
        <Table>
          <thead>
            <tr>
              <Th>Reference</Th>
              <Th>Guest</Th>
              <Th>Hotel · Room</Th>
              <Th>Stay</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Paid</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && <EmptyRow colSpan={7}>No bookings match these filters.</EmptyRow>}
            {bookings.map((b) => {
              const item = b.items[0];
              const paid =
                b.payment && b.payment.status !== 'FAILED' && b.payment.status !== 'INITIATED'
                  ? toNumber(b.payment.amount) - toNumber(b.payment.refundedAmount)
                  : 0;
              return (
                <Tr key={b.id}>
                  <Td>
                    <Link href={`/admin/bookings/${b.id}`} className="font-mono text-[13px] font-semibold text-primary hover:underline">
                      {b.reference}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{formatDate(b.createdAt)}</span>
                  </Td>
                  <Td>
                    <span className="block font-medium">{b.guestName}</span>
                    <span className="block text-xs text-muted-foreground">{b.guestEmail}</span>
                  </Td>
                  <Td>
                    <span className="block">{item?.room?.hotel.name ?? '—'}</span>
                    <span className="block text-xs text-muted-foreground">{item?.room?.name}</span>
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">
                    {item ? `${formatDate(item.checkIn)} → ${formatDate(item.checkOut)}` : '—'}
                  </Td>
                  <Td className="text-right font-semibold tabular-nums">{formatPKR(toNumber(b.grandTotal))}</Td>
                  <Td className="text-right tabular-nums text-muted-foreground">{formatPKR(paid)}</Td>
                  <Td>
                    <StatusBadge status={b.status} />
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
        <Pagination basePath="/admin/bookings" page={page} pageSize={PAGE_SIZE} total={total} searchParams={searchParams} />
      </Card>
    </>
  );
}
