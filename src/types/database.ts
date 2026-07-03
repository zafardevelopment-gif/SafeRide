// Auto-synced with Supabase schema. Run `npm run db:types` to regenerate.

export type UserRole = 'customer' | 'agent' | 'admin' | 'support';
export type QRStatus = 'unactivated' | 'active' | 'suspended' | 'lost';
export type PrintStatus = 'pending' | 'printed' | 'dispatched';
export type ScanActionType = 'notify_owner' | 'wrong_parking' | 'emergency';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'rejected';
export type NotificationChannel = 'sms' | 'whatsapp' | 'email' | 'push';
export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'delivered';
export type VehicleType = 'bike' | 'scooter' | 'car' | 'auto' | 'truck' | 'other';

export interface User {
  id: string;
  role: UserRole;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  deleted_at: string | null;
  profile_completed: boolean;
  referred_by_agent_id: string | null;
  notifications_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  referral_code: string;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  upi_id: string | null;
  commission_amount_paise: number | null;
  custom_activation_fee_paise: number | null;
  withdrawal_requested_at: string | null;
  total_commission_earned: number;
  total_commission_paid: number;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  vehicle_number: string;
  type: VehicleType;
  brand: string;
  model: string;
  color: string;
  year: number | null;
  is_active: boolean;
  is_placeholder: boolean;
  created_at: string;
  updated_at: string;
}

export interface QRCode {
  id: string;
  qr_id: string;           // Short URL-safe ID used in /scan/{qr_id}
  status: QRStatus;
  batch_id: string;
  agent_id: string | null; // Pre-tagged at batch generation for commission
  vehicle_id: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QRBatch {
  id: string;
  agent_id: string | null;
  quantity: number;
  print_status: PrintStatus;
  notes: string | null;
  created_by: string;      // Admin user_id who generated the batch
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  vehicle_id: string;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
  priority_order: number;  // 1 = first to notify
  created_at: string;
  updated_at: string;
}

export interface MedicalProfile {
  id: string;
  vehicle_id: string;
  blood_group: string | null;
  allergies: string | null;
  conditions: string | null;
  notes: string | null;
  consent_given: boolean;  // DPDP-compliant — user explicitly opted in
  consent_given_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  qr_id: string;           // References qr_codes.qr_id (not UUID) for fast lookup
  action_type: ScanActionType;
  scanner_message: string | null;
  location_lat: number | null;
  location_lng: number | null;
  photo_url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;   // In paise
  price_yearly: number;    // In paise (discounted)
  features: PlanFeatures;
  is_active: boolean;
  razorpay_plan_id_monthly: string | null;
  razorpay_plan_id_yearly: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanFeatures {
  sms_alerts: boolean;
  whatsapp_alerts: boolean;
  email_alerts: boolean;
  medical_profile: boolean;
  priority_support: boolean;
  max_vehicles: number;
  max_emergency_contacts: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  razorpay_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  qr_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;          // In paise
  gst_amount: number;      // In paise
  total_amount: number;    // In paise
  currency: string;        // 'INR'
  status: 'created' | 'paid' | 'failed' | 'refunded';
  invoice_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  agent_id: string;
  qr_id: string;
  payment_id: string | null;
  amount: number;          // In paise
  status: CommissionStatus;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  scan_id: string;
  channel: NotificationChannel;
  recipient: string;       // phone or email
  body: string;            // rendered message content, from src/lib/notification-templates.ts
  status: NotificationStatus;
  retry_count: number;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;  // percentage (0-100) or paise
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  plan_id: string | null;  // null = applies to all plans
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
