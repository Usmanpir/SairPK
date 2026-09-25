'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight, Mail, Phone, Timer, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  guestName: z.string().min(2, 'Please enter your full name.'),
  guestEmail: z.string().email('Please enter a valid email.'),
  guestPhone: z
    .string()
    .regex(/^(\+92|0)3\d{9}$/, 'Enter a valid Pakistani mobile number, e.g. +923001234567.')
});

type FormValues = z.infer<typeof formSchema>;

export function GuestDetailsForm({
  roomId,
  checkIn,
  checkOut,
  adults,
  childrenCount
}: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  childrenCount: number;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, checkIn, checkOut, adults, children: childrenCount, ...values })
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      router.push(`/checkout/${data.bookingId}`);
    } catch {
      setSubmitError('Network error — please check your connection and try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="guestName">Full name</Label>
        <Input id="guestName" placeholder="As shown on your CNIC or passport" leftIcon={<User />} {...register('guestName')} error={errors.guestName?.message} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="guestEmail">Email</Label>
          <Input id="guestEmail" type="email" placeholder="you@example.com" leftIcon={<Mail />} {...register('guestEmail')} error={errors.guestEmail?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guestPhone">Phone (Pakistan)</Label>
          <Input id="guestPhone" placeholder="+923001234567" leftIcon={<Phone />} {...register('guestPhone')} error={errors.guestPhone?.message} />
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm font-medium text-destructive" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Continue to payment {!isSubmitting && <ArrowRight className="h-4 w-4" />}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Timer className="h-3.5 w-3.5" /> We&apos;ll hold your room for 20 minutes while you complete payment.
      </p>
    </form>
  );
}
