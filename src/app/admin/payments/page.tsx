import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { AlertTriangle, Clock, RotateCcw, Wallet } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireManagementPage } from '@/lib/admin/guard';
import { formatDateTime, humanize, PAGE_SIZE, param, parsePage, pick } from '@/lib/admin/format';
import { toNumber } from '@/lib/pricing';
import { formatPKR } from '@/lib/utils';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/lib/validation/admin';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/admin/FilterBar';
import { PageHeader, StatCard } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyRow, Table, Td, Th, Tr } from '@/components/admin/Table';

export const metadata = { title: 'Payments' };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminPaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireManagementPage();

  const q = param(searchParams.q);
  const status = pick(param(searchParams.status), PAYMENT_STATUSES);
  const method = pick(param(searchParams.method), PAYMENT_METHODS);
  const page = parsePage(searchParams.page);

  const where: Prisma.PaymentWhereInput = {
    ...(status && { status }),
    ...(method && { method }),
    ...(q && {
      OR: [
        { providerTxnId: { contains: q, mode: 'insensitive' } },
        { booking: { reference: { contains: q, mode: 'insensitive' } } },
        { booking: { guestName: { contains: q, mode: 'insensitive' } } },
        { booking: { guestEmail: { contains: q, mode: 'insensitive' } } }
      ]
    })
  };

  const [total, payments, received, failed, awaiting] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { booking: { select: { id: true, reference: true, guestName: true, grandTotal: true } } }
    }),
    prisma.payment.aggregate({
      where: { status: { in: ['SUCCESS', 'PARTIALLY_REFUNDED', 'REFUNDED'] } },
      _sum: { amount: true, refundedAmount: true }
    }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.booking.aggregate({
      where: { status: { in: ['PENDING', 'PAYMENT_PENDING'] } },
      _sum: { grandTotal: true },
      _count: { _all: true }
    })
  ]);

  const gross = toNumber(received._sum.amount ?? 0);
  const refunded = toNumber(received._sum.refundedAmount ?? 0);

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every payment recorded against a booking. Open a booking to record, correct or refund a payment."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Net collected" value={formatPKR(gross - refunded)} hint={`${formatPKR(gross)} gross`} icon={<Wallet />} />
        <StatCard label="Refunded" value={formatPKR(refunded)} icon={<RotateCcw />} />
        <StatCard
          label="Awaiting payment"
          value={formatPKR(toNumber(awaiting._sum.grandTotal ?? 0))}
          hint={`${awaiting._count._all} pending or payment-pending booking${awaiting._count._all === 1 ? '' : 's'}`}
          icon={<Clock />}
        />
        <StatCard
          label="Failed attempts"
          value={failed}
          hint={
            <Link href="/admin/payments?status=FAILED" className="hover:underline">
              Review failed payments
            </Link>
          }
          icon={<AlertTriangle />}
        />
      </div>

      <Card className="overflow-hidden">
        <FilterBar
          basePath="/admin/payments"
          q={q}
          placeholder="Search booking reference, guest or transaction ID"
          selects={[
            { name: 'status', label: 'Statuses', value: status ?? '', options: PAYMENT_STATUSES },
            { name: 'method', label: 'Methods', value: method ?? '', options: PAYMENT_METHODS }
          ]}
        />
        <Table>
          <thead>
            <tr>
              <Th>Booking</Th>
              <Th>Method</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">Refunded</Th>
              <Th className="text-right">Booking total</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && <EmptyRow colSpan={7}>No payments match these filters.</EmptyRow>}
            {payments.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <Link href={`/admin/bookings/${p.booking.id}`} className="font-mono text-[13px] font-semibold text-primary hover:underline">
                    {p.booking.reference}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{p.booking.guestName}</span>
                </Td>
                <Td>
                  <span className="block">{humanize(p.method)}</span>
                  {p.providerTxnId && <span className="block max-w-[10rem] truncate font-mono text-[11px] text-muted-foreground">{p.providerTxnId}</span>}
                </Td>
                <Td className="text-right font-semibold tabular-nums">{formatPKR(toNumber(p.amount))}</Td>
                <Td className="text-right tabular-nums text-muted-foreground">
                  {toNumber(p.refundedAmount) > 0 ? formatPKR(toNumber(p.refundedAmount)) : '—'}
                </Td>
                <Td className="text-right tabular-nums text-muted-foreground">{formatPKR(toNumber(p.booking.grandTotal))}</Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
                <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(p.updatedAt)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <Pagination basePath="/admin/payments" page={page} pageSize={PAGE_SIZE} total={total} searchParams={searchParams} />
      </Card>
    </>
  );
}
