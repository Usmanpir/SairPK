'use client';

import { useState } from 'react';
import { Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { humanize } from '@/lib/admin/format';
import { BOOKING_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '@/lib/validation/admin';
import { formatPKR } from '@/lib/utils';
import { FormMessage } from './FormMessage';
import { useAdminMutation } from './useAdminMutation';

const RELEASED = ['CANCELLED', 'REFUNDED', 'EXPIRED'];

export function BookingStatusForm({ bookingId, status }: { bookingId: string; status: string }) {
  const { mutate, pending, error, saved } = useAdminMutation();
  const [next, setNext] = useState(status);
  const isClosed = RELEASED.includes(status);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next === status) return;
    if (RELEASED.includes(next) && !window.confirm(`Mark this booking as ${humanize(next).toLowerCase()}? Held rooms will be released back to inventory. This can't be undone.`)) {
      return;
    }
    await mutate(`/api/admin/bookings/${bookingId}`, 'PATCH', { status: next });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Label htmlFor="booking-status">Booking status</Label>
      <NativeSelect id="booking-status" value={next} onChange={(e) => setNext(e.target.value)}>
        {BOOKING_STATUSES.map((s) => (
          <option key={s} value={s} disabled={isClosed && !RELEASED.includes(s)}>
            {humanize(s)}
          </option>
        ))}
      </NativeSelect>
      {isClosed && (
        <p className="text-xs text-muted-foreground">
          This booking is closed and its rooms were released. It can&apos;t be reopened — create a new booking instead.
        </p>
      )}
      <FormMessage error={error} success={saved ? 'Status updated.' : null} />
      <Button type="submit" className="w-full" loading={pending} disabled={next === status}>
        Update status
      </Button>
    </form>
  );
}

export function BookingGuestForm({
  bookingId,
  guest
}: {
  bookingId: string;
  guest: { guestName: string; guestEmail: string; guestPhone: string };
}) {
  const { mutate, pending, error, fieldErrors, saved } = useAdminMutation();
  const [form, setForm] = useState(guest);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate(`/api/admin/bookings/${bookingId}`, 'PATCH', form);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="guestName">Guest name</Label>
          <Input id="guestName" leftIcon={<User />} value={form.guestName} onChange={set('guestName')} error={fieldErrors.guestName?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guestEmail">Email</Label>
          <Input id="guestEmail" type="email" leftIcon={<Mail />} value={form.guestEmail} onChange={set('guestEmail')} error={fieldErrors.guestEmail?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guestPhone">Phone</Label>
          <Input id="guestPhone" leftIcon={<Phone />} value={form.guestPhone} onChange={set('guestPhone')} error={fieldErrors.guestPhone?.[0]} />
        </div>
      </div>
      <FormMessage error={error} success={saved ? 'Guest details saved.' : null} />
      <div className="flex justify-end">
        <Button type="submit" variant="outline" loading={pending}>
          Save guest details
        </Button>
      </div>
    </form>
  );
}

export function PaymentEditor({
  bookingId,
  grandTotal,
  payment
}: {
  bookingId: string;
  grandTotal: number;
  payment: {
    amount: number;
    refundedAmount: number;
    method: string;
    status: string;
    providerTxnId: string | null;
    notes: string | null;
  } | null;
}) {
  const { mutate, pending, error, fieldErrors, saved } = useAdminMutation();
  const [form, setForm] = useState({
    amount: String(payment?.amount ?? grandTotal),
    refundedAmount: String(payment?.refundedAmount ?? 0),
    method: payment?.method ?? 'CASH',
    status: payment?.status ?? 'SUCCESS',
    providerTxnId: payment?.providerTxnId ?? '',
    notes: payment?.notes ?? ''
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const showRefund = form.status === 'REFUNDED' || form.status === 'PARTIALLY_REFUNDED';
  const net = (Number(form.amount) || 0) - (showRefund ? Number(form.refundedAmount) || 0 : 0);
  const balance = grandTotal - (form.status === 'SUCCESS' || showRefund ? net : 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.status === 'REFUNDED' && !window.confirm('Mark this payment as fully refunded? The booking will be set to Refunded and its rooms released.')) {
      return;
    }
    await mutate(`/api/admin/bookings/${bookingId}/payment`, 'PUT', {
      ...form,
      refundedAmount: showRefund ? form.refundedAmount : 0
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pay-amount">Amount received (PKR)</Label>
          <Input id="pay-amount" type="number" min={0} step="0.01" value={form.amount} onChange={set('amount')} error={fieldErrors.amount?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pay-method">Method</Label>
          <NativeSelect id="pay-method" value={form.method} onChange={set('method')}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {humanize(m)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pay-status">Payment status</Label>
          <NativeSelect id="pay-status" value={form.status} onChange={set('status')}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </NativeSelect>
        </div>
        {showRefund ? (
          <div className="space-y-2">
            <Label htmlFor="pay-refund">Refunded amount (PKR)</Label>
            <Input
              id="pay-refund"
              type="number"
              min={0}
              step="0.01"
              value={form.refundedAmount}
              onChange={set('refundedAmount')}
              error={fieldErrors.refundedAmount?.[0]}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="pay-txn">Transaction / receipt ID</Label>
            <Input id="pay-txn" value={form.providerTxnId} onChange={set('providerTxnId')} placeholder="Optional" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="pay-notes">Internal notes</Label>
        <textarea
          id="pay-notes"
          rows={2}
          value={form.notes}
          onChange={set('notes')}
          placeholder="e.g. Paid in cash at front desk"
          className="flex w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm transition-all placeholder:text-muted-foreground/70 hover:border-foreground/20 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
        />
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Net received</dt>
          <dd className="font-semibold tabular-nums">{formatPKR(form.status === 'SUCCESS' || showRefund ? net : 0)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{balance < 0 ? 'Overpaid' : 'Balance due'}</dt>
          <dd className={balance > 0 ? 'font-semibold tabular-nums text-amber-700' : 'font-semibold tabular-nums'}>
            {formatPKR(Math.abs(balance))}
          </dd>
        </div>
      </dl>

      <FormMessage error={error} success={saved ? 'Payment saved.' : null} />
      <Button type="submit" className="w-full" loading={pending}>
        {payment ? 'Update payment' : 'Record payment'}
      </Button>
    </form>
  );
}
