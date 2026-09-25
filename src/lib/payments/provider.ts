export type PaymentMethodKey =
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'JAZZCASH'
  | 'EASYPAISA'
  | 'PAYFAST'
  | 'STRIPE'
  | 'PAYPAL';

export interface ChargeRequest {
  amount: number; // in the smallest currency unit is NOT assumed — see currency
  currency: string; // e.g. "PKR"
  bookingReference: string;
  customerEmail: string;
  method: PaymentMethodKey;
}

export interface ChargeResult {
  success: boolean;
  providerTxnId: string;
  raw: unknown;
  failureReason?: string;
}

/**
 * Every real gateway (JazzCash, Easypaisa, PayFast, Stripe, PayPal, ...)
 * implements this interface. Nothing about the booking/payment flow depends
 * on a specific provider, so switching gateways is a config change
 * (PAYMENT_PROVIDER env var), not a code change.
 */
export interface PaymentProvider {
  charge(request: ChargeRequest): Promise<ChargeResult>;
}
