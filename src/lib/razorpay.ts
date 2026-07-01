import Razorpay from "razorpay";
import crypto from "crypto";

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

export async function createOrder(amountPaise: number, receipt: string) {
  return getClient().orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
  });
}

export async function createRefund(paymentId: string, amountPaise?: number) {
  return getClient().payments.refund(paymentId, amountPaise ? { amount: amountPaise } : {});
}

// Verifies the client-side checkout success callback per Razorpay's documented
// method: HMAC-SHA256 of "order_id|payment_id" using the key secret.
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

// Verifies a webhook payload per Razorpay's documented method: HMAC-SHA256 of
// the raw request body using the separate webhook secret.
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}
