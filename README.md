# Sair Pakistan — Travel & Tourism Platform (Foundation)

A foundation build of the Pakistan Travel & Tour Management and Booking Platform:
project scaffold, database schema, authentication, and one **complete, working
end-to-end flow** — hotel search → hotel detail → room selection → booking →
payment → confirmation — built to the same production standards (transaction-safe
inventory, validation, pluggable payment providers) the full platform needs.

This is a foundation, not the full 50+ module spec. See "Extending this
foundation" below for how each remaining module plugs into what's here.

## Stack

- Next.js 14 (App Router) + TypeScript, strict mode
- Tailwind CSS + a small Shadcn-style UI kit (`src/components/ui`)
- PostgreSQL + Prisma ORM
- NextAuth (credentials + Google), JWT sessions, role-based access
- React Hook Form + Zod validation
- TanStack Query (wired via `Providers`, ready for client-side data fetching)

## Getting started

```bash
npm install

cp .env.example .env
# then fill in DATABASE_URL and NEXTAUTH_SECRET at minimum
# generate a secret with: openssl rand -base64 32

npx prisma generate
npm run db:push      # creates tables from prisma/schema.prisma
npm run db:seed      # loads demo destinations, hotels and rooms

npm run dev
```

Visit `http://localhost:3000`. Demo accounts created by the seed script:

| Role   | Email                     | Password         |
|--------|---------------------------|-------------------|
| Super Admin | admin@sairpakistan.com | Admin@12345     |
| Admin  | ops@sairpakistan.com      | Ops@12345         |
| Customer | demo@sairpakistan.com   | Customer@12345    |

(The full list, including partner roles, is in `src/lib/demo-accounts.ts`.)

Payments run against `MockPaymentProvider` (`src/lib/payments/mock-provider.ts`)
by default, so the full booking flow works with zero payment-gateway setup —
every charge succeeds instantly. No real money moves.

## The working flow

1. **`/`** — hero search (destination, dates, guests) → `/hotels`
2. **`/hotels`** — server-rendered results; starting price per hotel is computed
   live from `RoomAvailability` for the searched date range (never shows a price
   for a room that can't actually be booked)
3. **`/hotels/[slug]`** — hotel detail, gallery, amenities, and per-room nightly
   pricing/availability for the searched dates
4. **`/booking/[roomId]`** — guest details form; price breakdown shown live
5. **`POST /api/bookings`** — creates the reservation inside a Prisma
   transaction that locks and decrements `RoomAvailability` per night, so two
   simultaneous bookings for the last room can't both succeed. Holds inventory
   for 20 minutes (`reservationExpiresAt`) if unpaid.
6. **`/checkout/[bookingId]`** — payment method selection
7. **`POST /api/payments`** — charges via the configured `PaymentProvider`,
   marks the booking `PAID`, generates an invoice number
8. **`/booking/confirmation/[bookingId]`** — confirmation screen

Cancellation (`POST /api/bookings/[id]/cancel`) releases held inventory back
to `RoomAvailability`.

## Management dashboard (`/admin`)

Super Admin and Admin accounts land on `/admin` after logging in (via
`/post-login`) instead of the traveller site. Access is enforced three times:
`src/middleware.ts` (JWT role), the `/admin` layout and pages, and every
`/api/admin/*` handler — the last two re-read role and `isActive` from the
database (`src/lib/admin/guard.ts`) so a demoted or suspended admin loses access
immediately.

| Section | What it does |
|---|---|
| Overview | Net revenue, amount awaiting payment, bookings by status, recent bookings and activity |
| Bookings | Search/filter; edit guest details; change status (closing statuses release inventory; closed bookings can't be reopened) |
| Payments | Ledger with totals; record offline payments, correct amounts, partial/full refunds (from a booking's page) — keeps booking status and invoice in sync |
| Accounts | Create accounts with any role, edit details, reset passwords, suspend/reactivate |
| Hotels | Verify/suspend listings, assign a hotel manager |
| Records | Audit log of every management action (`AuditLog`), and all issued invoices |

Admins can manage every account below admin level; only a Super Admin can
create or edit Admin/Super Admin accounts (`canManageRole` in `src/lib/roles.ts`).
Nobody can change their own role or suspend themselves.

After pulling this change, run `npm run db:push` — it adds
`Payment.refundedAmount`, `Payment.notes` and the `AuditLog` table.

## Project structure

```text
src/
├── app/
│   ├── page.tsx                        # homepage
│   ├── hotels/                         # search results + detail
│   ├── booking/[roomId]/                # guest details
│   ├── checkout/[bookingId]/            # payment
│   ├── booking/confirmation/[bookingId]/
│   ├── login/
│   └── api/
│       ├── auth/                       # NextAuth + registration
│       ├── hotels/                     # search endpoint
│       ├── bookings/                   # create / fetch / cancel
│       └── payments/                   # charge endpoint
├── components/
│   ├── ui/                             # Button, Card, Input, Label, Badge
│   ├── search/HotelSearchForm.tsx
│   ├── hotels/HotelCard.tsx, RoomCard.tsx
│   └── booking/GuestDetailsForm.tsx, PaymentForm.tsx, BookingSummary.tsx
├── lib/
│   ├── db.ts                           # Prisma client singleton
│   ├── auth.ts                         # NextAuth config
│   ├── pricing.ts                      # pricing engine (seasonal/weekend/tax/discount)
│   ├── payments/                       # provider interface + mock implementation
│   ├── validation/booking.ts           # Zod schemas
│   └── queries/                        # shared Prisma query functions
└── types/
prisma/
├── schema.prisma
└── seed.ts
```

## Database schema

`prisma/schema.prisma` models: `User`/`Account`/`Session` (NextAuth),
`Destination`, `Hotel`, `HotelImage`, `HotelAmenity`, `Room`, `RoomImage`,
`RoomAmenity`, `RoomAvailability`, `Booking`, `BookingItem`, `Payment`,
`Invoice`, `Review`, `Wishlist` — with the foreign keys, indexes, and unique
constraints (`@@unique([roomId, date])` on availability, for example) that the
double-booking prevention in `/api/bookings` depends on.

## Extending this foundation

Every remaining module from the spec follows the same three-part pattern
already established here: a Prisma model → a query/validation module in
`src/lib/` → an API route + page. Suggested build order:

1. **Tours, Activities, Transport, Guides** — copy the Hotel/Room/Booking
   pattern: each gets its own model, an `availability`-style table if it's
   inventory-bound, and a booking type already exists in `BookingType` enum
   to extend (`TOUR`, `ACTIVITY`, `TRANSPORT`, `GUIDE`, `PACKAGE`)
2. **Admin dashboard** — role-gated routes under `/admin`, guarded by
   `getServerSession` + a check on `session.user.role`; reuse the existing
   query functions with admin-only filters removed
3. **Hotel Manager / Tour Operator dashboards** — same pattern, scoped to
   `where: { managerId: session.user.id }`
4. **Reviews, Wishlist, Coupons, Commission** — models already scaffolded
   (Review, Wishlist) or straightforward additions following the same shape
5. **PDF generation, email/SMS notifications, real payment gateways** —
   implement behind the existing seams: `PaymentProvider` interface for
   gateways, a new `src/lib/pdf/` and `src/lib/notifications/` module for the
   rest, so nothing else in the codebase needs to change when you swap
   providers
6. **CMS, Blog, SEO, i18n (Urdu/RTL)** — additive; Next.js App Router
   supports `next-intl` or similar for the English/Urdu switch without
   restructuring existing routes

## Notes

- Prices are stored and displayed in PKR by default (`formatPKR` in
  `src/lib/utils.ts`); `Booking.currency` is already a field if you add
  multi-currency support.
- Image URLs in the seed data point to Unsplash source queries for demo
  purposes — swap for your configured `STORAGE_PROVIDER` in production.
- `MockPaymentProvider` always succeeds — replace `getPaymentProvider()` in
  `src/lib/payments/mock-provider.ts` with real gateway clients read from env
  vars before going to production; never hardcode credentials.
