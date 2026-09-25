import { randomUUID } from 'crypto';
import type { ChargeRequest, ChargeResult, PaymentProvider } from './provider';

/**
 * Development/demo provider. Always succeeds so the booking flow can be
 * exercised end-to-end without real gateway credentials. Replace with
 * JazzCashProvider / EasypaisaProvider / PayFastProvider / StripeProvider in
 * production, selected via getPaymentProvider() below.
 */
export class MockPaymentProvider implements PaymentProvider {
  async charge(request: ChargeRequest): Promise<ChargeResult> {
    return {
      success: true,
      providerTxnId: `MOCK-${randomUUID()}`,
      raw: { ...request, processedAt: new Date().toISOString() }
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  // In production this would switch on process.env.PAYMENT_PROVIDER and
  // construct the configured gateway client using PAYMENT_API_KEY etc.
  // Never hardcode credentials here — read them from env at call time inside
  // each provider implementation.
  return new MockPaymentProvider();
}
