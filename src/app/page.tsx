import { Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Landmark,
  MapPin,
  Receipt,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  Wallet
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { toNumber } from '@/lib/pricing';
import { formatPKR } from '@/lib/utils';
import { HotelSearchForm } from '@/components/search/HotelSearchForm';
import { HeroArt } from '@/components/landing/HeroArt';
import { SmartImage } from '@/components/ui/smart-image';
import { Stars } from '@/components/ui/stars';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export const revalidate = 300;

async function getFeaturedDestinations() {
  try {
    return await prisma.destination.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { hotels: true } } }
    });
  } catch {
    // DB not provisioned yet (e.g. first run before `db:push` + `db:seed`).
    return [];
  }
}

async function getFeaturedHotels() {
  try {
    return await prisma.hotel.findMany({
      where: { status: 'VERIFIED' },
      take: 3,
      orderBy: [{ starRating: 'desc' }, { createdAt: 'asc' }],
      include: {
        destination: true,
        images: { where: { isCover: true }, take: 1 },
        rooms: { select: { basePrice: true } }
      }
    });
  } catch {
    return [];
  }
}

async function getCounts() {
  try {
    const [destinations, hotels] = await Promise.all([
      prisma.destination.count(),
      prisma.hotel.count({ where: { status: 'VERIFIED' } })
    ]);
    return { destinations, hotels };
  } catch {
    return { destinations: 0, hotels: 0 };
  }
}

const PAYMENT_METHODS = [
  { label: 'JazzCash', icon: Smartphone },
  { label: 'Easypaisa', icon: Wallet },
  { label: 'Credit / Debit Card', icon: CreditCard },
  { label: 'Bank Transfer', icon: Landmark }
];

const FEATURES = [
  {
    icon: BadgeCheck,
    title: 'Verified stays only',
    body: 'Every hotel is reviewed and verified before it appears in search — no surprises at check-in.'
  },
  {
    icon: Receipt,
    title: 'Transparent pricing',
    body: 'See nightly rates, weekend pricing, discounts and taxes broken down before you pay.'
  },
  {
    icon: Timer,
    title: 'Your room is held',
    body: 'Once you enter guest details, inventory is reserved for you while you complete payment.'
  },
  {
    icon: ShieldCheck,
    title: 'Pay the local way',
    body: 'JazzCash, Easypaisa, cards or bank transfer — with a booking reference and invoice for every stay.'
  }
];

const STEPS = [
  { icon: Search, title: 'Search', body: 'Pick a destination, dates and guests. We only show rooms that are actually bookable.' },
  { icon: CalendarDays, title: 'Reserve', body: 'Choose your room and add guest details — we hold inventory while you pay.' },
  { icon: Sparkles, title: 'Pay & go', body: 'Checkout in seconds and get an instant confirmation with your reference.' }
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold text-balance sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}

export default async function HomePage() {
  const [destinations, featuredHotels, counts] = await Promise.all([
    getFeaturedDestinations(),
    getFeaturedHotels(),
    getCounts()
  ]);

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative -mt-[4.5rem] overflow-hidden bg-ink pb-20 pt-[4.5rem] text-white sm:pb-28">
        <HeroArt />

        <div className="container relative pt-14 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-1.5 text-xs font-medium text-white/85 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
              </span>
              Hotels across Pakistan, from Hunza to Gwadar
            </span>

            <h1
              className="mt-6 animate-fade-up text-[2.6rem] font-extrabold leading-[1.05] text-balance sm:text-6xl lg:text-7xl"
              style={{ animationDelay: '80ms' }}
            >
              Explore Pakistan{' '}
              <span className="text-gradient-gold font-display font-medium italic tracking-normal">like never before</span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl animate-fade-up text-base leading-relaxed text-white/70 text-balance sm:text-lg"
              style={{ animationDelay: '160ms' }}
            >
              Hotels, tours, activities and complete travel packages across the Northern Areas, Punjab, Sindh,
              Balochistan, KPK and Azad Kashmir.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-6xl animate-fade-up text-foreground" style={{ animationDelay: '240ms' }}>
            <Suspense fallback={<div className="h-[164px] rounded-[1.5rem] bg-white/90 shadow-lift lg:h-[92px]" />}>
              <HotelSearchForm />
            </Suspense>
          </div>

          <dl
            className="mx-auto mt-10 grid max-w-3xl animate-fade-up grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm"
            style={{ animationDelay: '320ms' }}
          >
            {[
              { value: counts.destinations || '—', label: 'Destinations' },
              { value: counts.hotels || '—', label: 'Verified hotels' },
              { value: '4', label: 'Ways to pay' }
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1 px-3 py-4 text-center sm:py-5">
                <dt className="order-2 text-[11px] font-medium uppercase tracking-wider text-white/55 sm:text-xs">{s.label}</dt>
                <dd className="text-2xl font-extrabold text-white sm:text-3xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- Payment strip ---------- */}
      <section className="border-b border-border/70">
        <div className="container flex flex-col items-center gap-5 py-8 sm:flex-row sm:justify-between">
          <p className="text-sm font-medium text-muted-foreground">Pay your way — locally trusted methods</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PAYMENT_METHODS.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Destinations ---------- */}
      <section id="destinations" className="container scroll-mt-24 py-20 sm:py-24">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Destinations"
            title={
              <>
                Popular destinations,{' '}
                <span className="font-display font-medium italic text-primary">handpicked</span>
              </>
            }
            description="From glacier-fed valleys in the north to the Arabian Sea coast — find a stay wherever the road takes you."
          />
          <Button asChild variant="outline" className="shrink-0 self-start sm:self-auto">
            <Link href="/hotels">
              View all hotels <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {destinations.length === 0 ? (
          <EmptyState
            icon={<MapPin />}
            title="No destinations yet"
            description={
              <>
                Run <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">npm run db:seed</code>{' '}
                after setting up your database to populate demo data.
              </>
            }
          />
        ) : (
          <div className="grid auto-rows-[190px] grid-cols-2 gap-4 sm:auto-rows-[220px] md:grid-cols-4">
            {destinations.map((d, i) => (
              <Link
                key={d.id}
                href={`/hotels?destination=${encodeURIComponent(d.name)}`}
                className={`group relative overflow-hidden rounded-2xl bg-muted shadow-soft ring-1 ring-black/5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift ${
                  i === 0 ? 'col-span-2 row-span-2' : ''
                } ${
                  // The 2×2 lead tile leaves one cell open when there are 8 items; let the last tile fill it.
                  i > 0 && i === destinations.length - 1 && (destinations.length + 3) % 4 === 3 ? 'col-span-2' : ''
                }`}
              >
                <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
                  <SmartImage src={d.coverImage} alt={d.name} seed={d.name} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                <span className="absolute right-3 top-3 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-white/90 text-foreground opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4" />
                </span>

                <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{d.region}</p>
                  <p className={`mt-0.5 font-extrabold leading-tight ${i === 0 ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-xl'}`}>
                    {d.name}
                  </p>
                  {i === 0 && (
                    <p className="mt-2 hidden max-w-sm text-sm leading-relaxed text-white/75 sm:block">{d.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium">
                    <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                      {d._count.hotels} stay{d._count.hotels !== 1 ? 's' : ''}
                    </span>
                    {i === 0 && d.bestTimeToVisit && (
                      <span className="rounded-full bg-secondary/90 px-2.5 py-1 text-secondary-foreground">
                        Best: {d.bestTimeToVisit}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Featured stays ---------- */}
      {featuredHotels.length > 0 && (
        <section className="relative overflow-hidden bg-muted/50 py-20 sm:py-24">
          <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div className="container relative">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Featured stays"
                title="Top-rated hotels travellers love"
                description="Comfortable, verified stays close to the main attractions — with mountain and valley views."
              />
              <Link href="/hotels" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Browse every stay <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featuredHotels.map((h) => {
                const from = h.rooms.length ? Math.min(...h.rooms.map((r) => toNumber(r.basePrice))) : null;
                return (
                  <Link
                    key={h.id}
                    href={`/hotels/${h.slug}`}
                    className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
                        <SmartImage src={h.images[0]?.url} alt={h.name} seed={h.name} />
                      </div>
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow-sm">
                        <MapPin className="h-3 w-3 text-primary" />
                        {h.destination.name}
                      </span>
                    </div>
                    <div className="p-5">
                      <Stars rating={h.starRating} />
                      <h3 className="mt-2 text-lg font-bold transition-colors group-hover:text-primary">{h.name}</h3>
                      <div className="mt-4 flex items-end justify-between border-t border-border/70 pt-4">
                        {from != null ? (
                          <p className="text-sm text-muted-foreground">
                            From <span className="text-lg font-extrabold text-foreground">{formatPKR(from)}</span> / night
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">View availability</p>
                        )}
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Why Sair ---------- */}
      <section className="container py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow="Why Sair Pakistan"
              title={
                <>
                  Booking built for the way{' '}
                  <span className="font-display font-medium italic text-primary">Pakistan travels</span>
                </>
              }
              description="A booking flow designed around local payment habits, honest pricing and rooms that are actually available on your dates."
            />
            <Button asChild size="lg" className="mt-8">
              <Link href="/hotels">
                Start exploring <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
                <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-glow">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="relative mt-5 text-base font-bold">{title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="border-y border-border/70 bg-muted/40 py-20 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">From search to confirmed in three steps</h2>
          </div>
          <ol className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" aria-hidden />
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative text-center">
                <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card text-primary shadow-soft">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-secondary text-[11px] font-extrabold text-secondary-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="container py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-emerald-800 to-ink px-6 py-14 text-center text-white shadow-lift sm:px-12 sm:py-20">
          <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-secondary/30 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold text-balance sm:text-5xl">
              Your next adventure is{' '}
              <span className="text-gradient-gold font-display font-medium italic">one search away</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-white/75">
              Snow peaks, turquoise lakes, Mughal heritage or a quiet beach — find the right stay and book it in minutes.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" variant="secondary">
                <Link href="/hotels">
                  Find a hotel <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass">
                <Link href="/#destinations">Browse destinations</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
