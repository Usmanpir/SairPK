import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireManagementPage } from '@/lib/admin/guard';
import { PAGE_SIZE, param, parsePage, pick } from '@/lib/admin/format';
import { HOTEL_STATUSES } from '@/lib/validation/admin';
import { Card } from '@/components/ui/card';
import { Stars } from '@/components/ui/stars';
import { FilterBar } from '@/components/admin/FilterBar';
import { HotelControls } from '@/components/admin/HotelControls';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyRow, Table, Td, Th, Tr } from '@/components/admin/Table';

export const metadata = { title: 'Hotels' };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminHotelsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireManagementPage();

  const q = param(searchParams.q);
  const status = pick(param(searchParams.status), HOTEL_STATUSES);
  const page = parsePage(searchParams.page);

  const where: Prisma.HotelWhereInput = {
    ...(status && { status }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { destination: { name: { contains: q, mode: 'insensitive' } } }
      ]
    })
  };

  const [total, hotels, managers] = await Promise.all([
    prisma.hotel.count({ where }),
    prisma.hotel.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        destination: { select: { name: true } },
        _count: { select: { rooms: true } }
      }
    }),
    prisma.user.findMany({
      where: { role: 'HOTEL_MANAGER' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, isActive: true }
    })
  ]);
  const managerOptions = managers.map((m) => ({ id: m.id, name: m.isActive ? m.name : `${m.name} (suspended)` }));

  return (
    <>
      <PageHeader
        title="Hotels"
        description="Verify or suspend listings and assign each hotel to a hotel manager account."
      />

      <Card className="overflow-hidden">
        <FilterBar
          basePath="/admin/hotels"
          q={q}
          placeholder="Search hotel or destination"
          selects={[{ name: 'status', label: 'Statuses', value: status ?? '', options: HOTEL_STATUSES }]}
        />
        <Table>
          <thead>
            <tr>
              <Th>Hotel</Th>
              <Th>Destination</Th>
              <Th className="text-right">Rooms</Th>
              <Th>Status</Th>
              <Th>Manage</Th>
            </tr>
          </thead>
          <tbody>
            {hotels.length === 0 && <EmptyRow colSpan={5}>No hotels match these filters.</EmptyRow>}
            {hotels.map((h) => (
              <Tr key={h.id}>
                <Td>
                  <Link
                    href={`/hotels/${h.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 font-semibold hover:text-primary hover:underline"
                  >
                    {h.name} <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Stars rating={h.starRating} className="mt-0.5 flex" />
                </Td>
                <Td className="text-muted-foreground">{h.destination.name}</Td>
                <Td className="text-right tabular-nums">{h._count.rooms}</Td>
                <Td>
                  <StatusBadge status={h.status} />
                </Td>
                <Td>
                  <HotelControls hotelId={h.id} status={h.status} managerId={h.managerId} managers={managerOptions} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <Pagination basePath="/admin/hotels" page={page} pageSize={PAGE_SIZE} total={total} searchParams={searchParams} />
      </Card>
    </>
  );
}
