'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  BedDouble,
  CalendarCheck,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
  Users,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { ROLE_LABELS, type Role } from '@/lib/roles';
import { cn } from '@/lib/utils';

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/payments', label: 'Payments', icon: Wallet },
  { href: '/admin/users', label: 'Accounts', icon: Users },
  { href: '/admin/hotels', label: 'Hotels', icon: BedDouble },
  { href: '/admin/records', label: 'Records', icon: History }
];

export function AdminShell({
  user,
  children
}: {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const initial = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-ink text-white/70 lg:flex">
        <div className="flex h-[4.5rem] items-center gap-2 px-6">
          <Logo tone="light" />
        </div>
        <p className="px-6 pb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Management</p>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(href) ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive(href) && 'text-secondary')} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" /> View public site
          </Link>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-secondary to-amber-600 text-xs font-bold text-white">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
              <span className="block truncate text-[11px]">{ROLE_LABELS[user.role as Role] ?? user.role}</span>
            </span>
            <button
              type="button"
              aria-label="Sign out"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar + scrollable tab nav */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-ink text-white/70 lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Logo tone="light" />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium',
                  isActive(href) ? 'bg-white/15 text-white' : 'hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
