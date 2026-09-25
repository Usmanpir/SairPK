import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, UserRound } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireManagementPage } from '@/lib/admin/guard';
import { formatDateTime, humanize } from '@/lib/admin/format';
import { toNumber } from '@/lib/pricing';
import { formatDate, formatPKR } from '@/lib/utils';
import { ROLE_LABELS, type Role } from '@/lib/roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { BookingGuestForm, BookingStatusForm, PaymentEditor } from '@/components/admin/BookingForms';

export const metadata = { title: 'Booking' };

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  await requireManagementPage();

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, passwordHash: true } },
      items: { include: { room: { include: { hotel: { select: { name: true, slug: true } } } } } },
      payment: true,
      invoice: true
    }
  });
  if (!booking) notFound();

  const history = await prisma.auditLog.findMany({
    where: { entityType: 'Booking', entityId: booking.id },
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { name: true } } }
  });

  const payment = booking.payment
    ? {
        amount: toNumber(booking.payment.amount),
        refundedAmount: toNumber(booking.payment.refundedAmount),
        method: booking.payment.method,
        status: booking.payment.status,
        providerTxnId: booking.payment.providerTxnId,
        notes: booking.payment.notes
      }
    : null;

  return (
    <>
      <PageHeader
        back={{ href: '/admin/bookings', label: 'All bookings' }}
        title={booking.reference}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={booking.status} /> Created {formatDateTime(booking.createdAt)} · {humanize(booking.type)}{' '}
            booking
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.items.map((item) => (
                <div key={item.id} className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold">{item.room?.hotel.name ?? 'Deleted hotel'}</p>
                    <p className="text-sm text-muted-foreground">{item.room?.name ?? 'Deleted room'}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Check-in</dt>
                    <dd className="font-medium">{formatDate(item.checkIn)}</dd>
                    <dt className="text-muted-foreground">Check-out</dt>
                    <dd className="font-medium">{formatDate(item.checkOut)}</dd>
                    <dt className="text-muted-foreground">Guests</dt>
                    <dd className="font-medium">
                      {item.adults} adult{item.adults === 1 ? '' : 's'}
                      {item.children > 0 && `, ${item.children} child${item.children === 1 ? '' : 'ren'}`}
                    </dd>
                    <dt className="text-muted-foreground">Nights</dt>
                    <dd className="font-medium">
                      {item.nights} × {formatPKR(toNumber(item.unitPrice))}
                    </dd>
                  </dl>
                </div>
              ))}

              <dl className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{formatPKR(toNumber(booking.subtotal))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="tabular-nums">−{formatPKR(toNumber(booking.discountTotal))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="tabular-nums">{formatPKR(toNumber(booking.taxTotal))}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <dt>Grand total</dt>
                  <dd className="tabular-nums">{formatPKR(toNumber(booking.grandTotal))}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest details</CardTitle>
              <CardDescription>The contact details used for this booking&apos;s confirmation.</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingGuestForm
                bookingId={booking.id}
                guest={{ guestName: booking.guestName, guestEmail: booking.guestEmail, guestPhone: booking.guestPhone }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No changes made from the dashboard yet.</p>
              ) : (
                <ol className="space-y-4 border-l border-border pl-5">
                  {history.map((h) => (
                    <li key={h.id} className="relative text-sm">
                      <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card" />
                      <p className="font-medium">{h.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.actor?.name ?? 'Deleted account'} · {formatDateTime(h.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingStatusForm bookingId={booking.id} status={booking.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>
                {payment ? (
                  <span className="flex items-center gap-2">
                    Currently <StatusBadge status={payment.status} />
                  </span>
                ) : (
                  'No payment recorded yet. Record an offline payment (cash, bank transfer) here.'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentEditor bookingId={booking.id} grandTotal={toNumber(booking.grandTotal)} payment={payment} />
              {booking.invoice && (
                <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" /> Invoice #{booking.invoice.invoiceNo} · issued {formatDate(booking.invoice.issuedAt)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/admin/users/${booking.user.id}`}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-primary">
                  <UserRound className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{booking.user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {booking.user.email} · {ROLE_LABELS[booking.user.role as Role]}
                    {!booking.user.passwordHash && ' · guest checkout'}
                  </span>
                </span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
