import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireManagementPage } from '@/lib/admin/guard';
import { formatDateTime, humanize, PAGE_SIZE, param, parsePage, pick } from '@/lib/admin/format';
import { toNumber } from '@/lib/pricing';
import { cn, formatDate, formatPKR } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/admin/FilterBar';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyRow, Table, Td, Th, Tr } from '@/components/admin/Table';

export const metadata = { title: 'Records' };

type SearchParams = Record<string, string | string[] | undefined>;

const TABS = [
  { key: 'activity', label: 'Activity log' },
  { key: 'invoices', label: 'Invoices' }
] as const;

const ENTITY_TYPES = ['User', 'Booking', 'Hotel'] as const;

// Where each audited entity is managed in the dashboard.
const ENTITY_HREF: Record<string, (id: string) => string> = {
  User: (id) => `/admin/users/${id}`,
  Booking: (id) => `/admin/bookings/${id}`,
  Hotel: () => '/admin/hotels'
};

export default async function AdminRecordsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireManagementPage();

  const tab = pick(param(searchParams.tab), ['activity', 'invoices'] as const) ?? 'activity';

  return (
    <>
      <PageHeader title="Records" description="An audit trail of every management action, and all issued invoices." />

      <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1 sm:w-fit" role="tablist">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/records?tab=${t.key}`}
            role="tab"
            aria-selected={tab === t.key}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors sm:flex-none',
              tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'activity' ? <ActivityLog searchParams={searchParams} /> : <Invoices searchParams={searchParams} />}
    </>
  );
}

async function ActivityLog({ searchParams }: { searchParams: SearchParams }) {
  const q = param(searchParams.q);
  const entity = pick(param(searchParams.entity), ENTITY_TYPES);
  const page = parsePage(searchParams.page);

  const where: Prisma.AuditLogWhereInput = {
    ...(entity && { entityType: entity }),
    ...(q && {
      OR: [
        { summary: { contains: q, mode: 'insensitive' } },
        { actor: { name: { contains: q, mode: 'insensitive' } } },
        { actor: { email: { contains: q, mode: 'insensitive' } } }
      ]
    })
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { id: true, name: true } } }
    })
  ]);

  return (
    <Card className="overflow-hidden">
      <FilterBar
        basePath="/admin/records"
        q={q}
        placeholder="Search changes or who made them"
        selects={[{ name: 'entity', label: 'Records', value: entity ?? '', options: ENTITY_TYPES }]}
      />
      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Who</Th>
            <Th>Record</Th>
            <Th>Change</Th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && <EmptyRow colSpan={4}>No management actions recorded yet.</EmptyRow>}
          {logs.map((log) => (
            <Tr key={log.id}>
              <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</Td>
              <Td className="whitespace-nowrap">
                {log.actor ? (
                  <Link href={`/admin/users/${log.actor.id}`} className="font-medium hover:text-primary hover:underline">
                    {log.actor.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Deleted account</span>
                )}
              </Td>
              <Td>
                <Link href={ENTITY_HREF[log.entityType]?.(log.entityId) ?? '#'}>
                  <Badge variant="outline">{log.entityType}</Badge>
                </Link>
              </Td>
              <Td>{log.summary}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Pagination basePath="/admin/records" page={page} pageSize={PAGE_SIZE} total={total} searchParams={searchParams} />
    </Card>
  );
}

async function Invoices({ searchParams }: { searchParams: SearchParams }) {
  const q = param(searchParams.q);
  const page = parsePage(searchParams.page);

  const where: Prisma.InvoiceWhereInput = q
    ? {
        OR: [
          { invoiceNo: { contains: q, mode: 'insensitive' } },
          { booking: { reference: { contains: q, mode: 'insensitive' } } },
          { booking: { guestName: { contains: q, mode: 'insensitive' } } }
        ]
      }
    : {};

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        booking: {
          select: { id: true, reference: true, guestName: true, grandTotal: true, status: true, payment: { select: { method: true } } }
        }
      }
    })
  ]);

  return (
    <Card className="overflow-hidden">
      <FilterBar
        basePath="/admin/records"
        hidden={{ tab: 'invoices' }}
        q={q}
        placeholder="Search invoice no., booking reference or guest"
      />
      <Table>
        <thead>
          <tr>
            <Th>Invoice</Th>
            <Th>Issued</Th>
            <Th>Booking</Th>
            <Th>Method</Th>
            <Th className="text-right">Amount</Th>
            <Th>Booking status</Th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 && <EmptyRow colSpan={6}>No invoices issued yet.</EmptyRow>}
          {invoices.map((inv) => (
            <Tr key={inv.id}>
              <Td className="font-mono text-[13px] font-semibold">{inv.invoiceNo}</Td>
              <Td className="whitespace-nowrap text-muted-foreground">{formatDate(inv.issuedAt)}</Td>
              <Td>
                <Link href={`/admin/bookings/${inv.booking.id}`} className="font-mono text-[13px] font-semibold text-primary hover:underline">
                  {inv.booking.reference}
                </Link>
                <span className="block text-xs text-muted-foreground">{inv.booking.guestName}</span>
              </Td>
              <Td className="text-muted-foreground">{inv.booking.payment ? humanize(inv.booking.payment.method) : '—'}</Td>
              <Td className="text-right font-semibold tabular-nums">{formatPKR(toNumber(inv.booking.grandTotal))}</Td>
              <Td>
                <StatusBadge status={inv.booking.status} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Pagination basePath="/admin/records" page={page} pageSize={PAGE_SIZE} total={total} searchParams={searchParams} />
    </Card>
  );
}
