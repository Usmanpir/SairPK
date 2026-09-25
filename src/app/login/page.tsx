'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, BadgeCheck, KeyRound, Lock, Mail, Receipt, ShieldCheck, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeroArt } from '@/components/landing/HeroArt';
import { DEMO_ACCOUNTS } from '@/lib/demo-accounts';
import { cn } from '@/lib/utils';

// Quick-login panel is a local-development convenience only; hidden in production builds.
const SHOW_DEMO_ACCOUNTS = process.env.NODE_ENV !== 'production';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
    </svg>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password.');
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-extrabold">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">Log in to manage your bookings and check out faster.</p>

      <Button variant="outline" size="lg" className="mt-8 w-full" onClick={() => signIn('google', { callbackUrl })}>
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative my-7 flex items-center gap-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleCredentialsLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            leftIcon={<Lock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm font-medium text-destructive" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" loading={loading}>Log in</Button>
      </form>

      {SHOW_DEMO_ACCOUNTS && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" /> Demo accounts
            <span className="font-medium normal-case tracking-normal">· click to fill</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => {
              const selected = email === a.email;
              return (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(a.password);
                    setError(null);
                  }}
                  className={cn(
                    'rounded-xl border bg-card px-3 py-2 text-left transition-all hover:-translate-y-px hover:border-primary/40 hover:shadow-soft',
                    selected ? 'border-primary ring-1 ring-primary' : 'border-border'
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {a.role.includes('ADMIN') && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                    {a.label}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">{a.email}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const PERKS = [
  { icon: BadgeCheck, text: 'Verified hotels across every province' },
  { icon: Timer, text: 'Rooms held for you while you pay' },
  { icon: Receipt, text: 'Transparent pricing — taxes shown upfront' }
];

export default function LoginPage() {
  return (
    <div className="grid min-h-[calc(100vh-4.5rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink text-white lg:block">
        <HeroArt />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Sair Pakistan</p>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight">
              Your journey through{' '}
              <span className="text-gradient-gold font-display font-medium italic">Pakistan</span> starts here.
            </h2>
          </div>
          <ul className="max-w-sm space-y-3 pb-24">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm backdrop-blur-md">
                <Icon className="h-4 w-4 text-secondary" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-start justify-center px-4 py-14 sm:px-8 lg:items-center">
        <Suspense fallback={<div className="h-[480px] w-full max-w-md" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
