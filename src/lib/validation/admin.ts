import { z } from 'zod';
import { USER_ROLES } from '@/lib/roles';

const pkPhone = z
  .string()
  .trim()
  .regex(/^(\+92|0)3\d{9}$/, 'Enter a valid Pakistani mobile number, e.g. +923001234567.');

// Empty form fields arrive as "" — treat them as "not provided".
const optionalPhone = z.preprocess((v) => (v === '' ? null : v), pkPhone.nullable().optional());

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.'),
  email: z.string().trim().toLowerCase().email('A valid email is required.'),
  phone: optionalPhone,
  role: z.enum(USER_ROLES),
  password: z.string().min(8, 'Password must be at least 8 characters.')
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').optional(),
  email: z.string().trim().toLowerCase().email('A valid email is required.').optional(),
  phone: optionalPhone,
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
  // Only set when an admin resets the password.
  password: z.string().min(8, 'Password must be at least 8 characters.').optional()
});

export const BOOKING_STATUSES = [
  'PENDING',
  'PAYMENT_PENDING',
  'CONFIRMED',
  'PAID',
  'CANCELLED',
  'COMPLETED',
  'REFUNDED',
  'EXPIRED'
] as const;

export const updateBookingSchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  guestName: z.string().trim().min(2, 'Name is required.').optional(),
  guestEmail: z.string().trim().email('A valid email is required.').optional(),
  guestPhone: pkPhone.optional()
});

export const PAYMENT_METHODS = ['CARD', 'BANK_TRANSFER', 'CASH', 'JAZZCASH', 'EASYPAISA', 'PAYFAST', 'STRIPE', 'PAYPAL'] as const;
export const PAYMENT_STATUSES = ['INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'] as const;

export const upsertPaymentSchema = z
  .object({
    amount: z.coerce.number().min(0, 'Amount cannot be negative.').max(99_999_999),
    refundedAmount: z.coerce.number().min(0, 'Refund cannot be negative.').max(99_999_999).default(0),
    method: z.enum(PAYMENT_METHODS),
    status: z.enum(PAYMENT_STATUSES),
    providerTxnId: z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(120).nullable().optional()),
    notes: z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(2000).nullable().optional())
  })
  .refine((d) => d.refundedAmount <= d.amount, {
    message: 'Refund cannot exceed the amount paid.',
    path: ['refundedAmount']
  });

export const HOTEL_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'] as const;

export const updateHotelSchema = z.object({
  status: z.enum(HOTEL_STATUSES).optional(),
  managerId: z.string().cuid().nullable().optional()
});
