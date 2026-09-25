import Link from 'next/link';
import { Logo } from './Logo';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/hotels', label: 'All hotels' },
      { href: '/#destinations', label: 'Destinations' },
      { href: '/hotels?destination=Hunza', label: 'Hunza' },
      { href: '/hotels?destination=Skardu', label: 'Skardu' }
    ]
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Log in' },
      { href: '/dashboard/bookings', label: 'My bookings' }
    ]
  },
  {
    title: 'Regions',
    links: [
      { href: '/hotels?destination=Swat', label: 'Khyber Pakhtunkhwa' },
      { href: '/hotels?destination=Lahore', label: 'Punjab' },
      { href: '/hotels?destination=Gwadar', label: 'Balochistan' }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white/70">
      <div className="bg-grid-light mask-fade-b pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" aria-hidden />

      <div className="container relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Hotels, tours and complete travel packages across the Northern Areas, Punjab, Sindh, Balochistan, KPK
              and Azad Kashmir — booked in minutes, paid your way.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">{col.title}</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="transition-colors hover:text-secondary">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Sair Pakistan. Prices shown in PKR unless stated otherwise.</p>
          <p className="flex items-center gap-1.5">
            Made for travellers exploring <span className="font-medium text-white/80">Pakistan</span>
            <span className="text-secondary">✦</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
