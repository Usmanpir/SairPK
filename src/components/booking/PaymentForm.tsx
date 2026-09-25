'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CreditCard, Info, Landmark, Lock, Smartphone, Wallet, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const METHODS: { key: string; label: string; hint: string; icon: LucideIcon }[] = [
  { key: 'CARD', label: 'Credit / Debit Card', hint: 'All major cards', icon: CreditCard },
  { key: 'JAZZCASH', label: 'JazzCash', hint: 'Mobile wallet', icon: Smartphone },
  { key: 'EASYPAISA', label: 'Easypaisa', hint: 'Mobile wallet', icon: Wallet },
  { key: 'BANK_TRANSFER', label: 'Bank Transfer', hint: 'Direct from your bank', icon: Landmark }
];

export function PaymentForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [method, setMethod] = useState('CARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, method })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Payment failed. Please try again.');
        setLoading(false);
        return;
      }

      router.push(`/booking/confirmation/${bookingId}`);
    } catch {
      setError('Network error — please check your connection and try again.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
        {METHODS.map((m) => {
          const selected = method === m.key;
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMethod(m.key)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-px hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                selected ? 'border-primary bg-accent/60 ring-1 ring-primary shadow-soft' : 'border-border hover:border-foreground/20'
              )}
            >
              <span
                className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors',
                  selected ? 'bg-primary text-white' : 'bg-muted text-foreground/70 group-hover:text-primary'
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="block text-xs text-muted-foreground">{m.hint}</span>
              </span>
              <span
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
                  selected ? 'border-primary' : 'border-border'
                )}
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm font-medium text-destructive" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button size="lg" className="w-full" onClick={handlePay} loading={loading}>
        {!loading && <Lock className="h-4 w-4" />}
        Pay now
      </Button>
      <p className="flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
        This is a demo checkout using a mock payment provider — no real charge is made.
      </p>
    </div>
  );
}
