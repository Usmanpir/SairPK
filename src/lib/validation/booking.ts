import { z } from 'zod';

export const hotelSearchSchema = z.object({
  destinationSlug: z.string().optional(),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  adults: z.coerce.number().int().min(1).max(20).default(2),
  children: z.coerce.number().int().min(0).max(10).default(0),
  rooms: z.coerce.number().int().min(1).max(10).default(1)
});

export const createBookingSchema = z
  .object({
    roomId: z.string().cuid(),
    checkIn: z.string().date(),
    checkOut: z.string().date(),
    adults: z.coerce.number().int().min(1).max(20),
    children: z.coerce.number().int().min(0).max(10).default(0),
    guestName: z.string().min(2, 'Name is required.'),
    guestEmail: z.string().email('A valid email is required.'),
    // Pakistani mobile format: +92 3XX XXXXXXX
    guestPhone: z
      .string()
      .regex(/^(\+92|0)3\d{9}$/, 'Enter a valid Pakistani mobile number, e.g. +923001234567.')
  })
  .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
    message: 'Check-out date must be after check-in date.',
    path: ['checkOut']
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const initiatePaymentSchema = z.object({
  bookingId: z.string().cuid(),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'CASH', 'JAZZCASH', 'EASYPAISA', 'PAYFAST', 'STRIPE', 'PAYPAL'])
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  phone: z
    .string()
    .regex(/^(\+92|0)3\d{9}$/, 'Enter a valid Pakistani mobile number.')
    .optional()
});
