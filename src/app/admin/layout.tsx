import type { Metadata } from 'next';
import { requireManagementPage } from '@/lib/admin/guard';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: { default: 'Management', template: '%s · Management | Sair Pakistan' },
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireManagementPage();
  return <AdminShell user={user}>{children}</AdminShell>;
}
