export * from './database';

// Server Action response envelope — all actions return this shape
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Razorpay checkout options passed to the browser SDK
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
