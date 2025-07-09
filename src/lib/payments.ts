// ============================================================
// MediBook — Payment provider seam
//
// This is the ONLY place that talks to a payment gateway.
// Currently: mock implementation (always succeeds).
//
// TODO: Replace mockProcessPayment with real Stripe/Razorpay call.
//       Keep the same function signature so callers don't change.
// ============================================================

export type PaymentResult =
  | { success: true; transactionId: string }
  | { success: false; error: string }

/**
 * Mock payment processor.
 * Simulates a brief processing delay and always returns success.
 *
 * Replace this body with Stripe.paymentIntents.create() or
 * Razorpay orders API when going to production.
 */
export async function mockProcessPayment(params: {
  appointmentId: string
  amountPaise: number
  currency?: string
}): Promise<PaymentResult> {
  // Simulate network latency (50-200 ms)
  await new Promise((resolve) =>
    setTimeout(resolve, 50 + Math.floor(Math.random() * 150))
  )

  // Generate a mock transaction ID
  const transactionId = `mock_${params.appointmentId}_${Date.now()}`

  return { success: true, transactionId }
}

/**
 * Formats paise as a human-readable rupee string.
 * e.g. 150000 → "₹1,500"
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees)
}
