'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { isManagementRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/hotels', label: 'Hotels' },
  { href: '/#destinations', label: 'Destinations' },
  { href: '/dashboard/bookings', label: 'My Bookings' }
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // The landing page has a dark hero, so the header starts transparent there.
  const overHero = pathname === '/' && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const initial = (session?.user?.name ?? session?.user?.email ?? '?').charAt(0).toUpperCase();
  const isManager = isManagementRole(session?.user?.role);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        overHero
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-border/70 bg-background/80 shadow-[0_1px_0_hsl(var(--border)/0.4)] backdrop-blur-xl'
      )}
    >
      <div className="container flex h-[4.5rem] items-center justify-between gap-4">
        <Logo tone={overHero ? 'light' : 'dark'} />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = item.href === pathname;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  overHero
                    ? 'text-white/80 hover:bg-white/10 hover:text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  active && !overHero && 'bg-muted text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <div className="hidden items-center gap-2 md:flex">
              {isManager && (
                <Button asChild size="sm" variant={overHero ? 'secondary' : 'default'} className="rounded-full px-4">
                  <Link href="/admin">
                    <LayoutDashboard className="h-4 w-4" /> Management
                  </Link>
                </Button>
              )}
              <span
                className={cn(
                  'flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium',
                  overHero ? 'bg-white/10 text-white' : 'bg-muted text-foreground'
                )}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-secondary to-amber-600 text-xs font-bold text-white">
                  {initial}
                </span>
                <span className="max-w-[9rem] truncate">{session.user.name ?? session.user.email}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={() => signOut({ callbackUrl: '/' })}
                className={cn(overHero && 'text-white hover:bg-white/10 hover:text-white')}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  overHero ? 'text-white/85 hover:text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Log in
              </Link>
              <Button asChild size="sm" variant={overHero ? 'secondary' : 'default'} className="rounded-full px-5">
                <Link href="/hotels">Book a stay</Link>
              </Button>
            </div>
          )}

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'grid h-10 w-10 place-items-center rounded-full transition-colors md:hidden',
              overHero ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'
            )}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-border bg-background md:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-4">
              {session?.user ? (
                <div className="grid gap-2">
                  {isManager && (
                    <Button asChild>
                      <Link href="/admin">
                        <LayoutDashboard className="h-4 w-4" /> Management dashboard
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: '/' })}>
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/hotels">Book a stay</Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
