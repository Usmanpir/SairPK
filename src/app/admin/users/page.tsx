import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { UserPlus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireManagementPage } from '@/lib/admin/guard';
import { PAGE_SIZE, param, parsePage, pick } from '@/lib/admin/format';
import { ROLE_LABELS, USER_ROLES } from '@/lib/roles';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/admin/FilterBar';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { ActiveBadge } from '@/components/admin/StatusBadge';
import { EmptyRow, Table, Td, Th, Tr } from '@/components/admin/Table';

export const metadata = { title: 'Accounts' };

type SearchParams = Record<string, string | string[] | undefined>;

const ACCOUNT_STATES = ['ACTIVE', 'SUSPENDED'] as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireManagementPage();

  const q = param(searchParams.q);
  const role = pick(param(searchParams.role), USER_ROLES);
  const state = pick(param(searchParams.state), ACCOUNT_STATES);
  const page = parsePage(searchParams.page);

  const where: Prisma.UserWhereInput = {
    ...(role && { role }),
    ...(state && { isActive: state === 'ACTIVE' }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } }
      ]
    })
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        passwordHash: true,
        _count: { select: { bookings: true } }
      }
    })
  ]);

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Create staff and partner accounts, edit details, reset passwords and suspend access."
        actions={
          <Button asChild>
            <Link href="/admin/users/new">
              <UserPlus className="h-4 w-4" /> New account
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar
          basePath="/admin/users"
          q={q}
          placeholder="Search name, email or phone"
          selects={[
            { name: 'role', label: 'Roles', value: role ?? '', options: USER_ROLES },
            { name: 'state', label: 'States', value: state ?? '', options: ACCOUNT_STATES }
          ]}
        />
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Phone</Th>
              <Th className="text-right">Bookings</Th>
              <Th>Joined</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && <EmptyRow colSpan={6}>No accounts match these filters.</EmptyRow>}
            {users.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <Link href={`/admin/users/${u.id}`} className="font-semibold text-primary hover:underline">
                    {u.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{u.email}</span>
                </Td>
                <Td>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={u.role === 'CUSTOMER' ? 'muted' : 'default'}>{ROLE_LABELS[u.role]}</Badge>
                    {!u.passwordHash && <Badge variant="outline">Guest</Badge>}
                  </span>
                </Td>
                <Td className="text-muted-foreground">{u.phone ?? '—'}</Td>
                <Td className="text-right tabular-nums">{u._count.bookings}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{formatDate(u.createdAt)}</Td>
                <Td>
                  <ActiveBadge active={u.isActive} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <Pagination basePath="/admin/users" page={page} pageSize={PAGE_SIZE} total={total} searchParams={searchParams} />
      </Card>
    </>
  );
}
