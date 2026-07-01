"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  renderTemplate,
  formatVehicleLabel,
  formatMapsLine,
  formatMedicalLine,
} from "@/lib/notification-templates";
import type { ActionResult, NotificationChannel, Scan } from "@/types";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const RATE_LIMIT_MAX_SCANS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 5;

async function getRequestMeta() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent") ?? null;
  return { ip, userAgent };
}

// DB-backed rate limit — no Redis/Upstash dependency. Counts recent scans
// for this QR from this IP using the existing ss_scans table + indexes.
async function isRateLimited(qrId: string, ip: string | null): Promise<boolean> {
  if (!ip) return false; // can't rate-limit what we can't identify
  const adminClient = createAdminClient();
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await adminClient
    .from("ss_scans")
    .select("id", { count: "exact", head: true })
    .eq("qr_id", qrId)
    .eq("ip_address", ip)
    .gte("created_at", since);

  return (count ?? 0) >= RATE_LIMIT_MAX_SCANS;
}

// Writes a queued notification row with its fully rendered message body —
// never actually sends. Real sending (Exotel/Resend) is a deliberate
// deferral; swap this in later using the same body already stored here.
async function queueNotification(
  scanId: string,
  channel: NotificationChannel,
  recipient: string,
  body: string
) {
  const adminClient = createAdminClient();
  await adminClient.from("ss_notifications_log").insert({
    scan_id: scanId,
    channel,
    recipient,
    body,
    status: "queued",
  });
}

async function resolveActiveQR(qrId: string) {
  const adminClient = createAdminClient();
  const { data: qrCode } = await adminClient
    .from("ss_qr_codes")
    .select("id, qr_id, status, vehicle_id")
    .eq("qr_id", qrId)
    .maybeSingle();

  if (!qrCode || qrCode.status !== "active" || !qrCode.vehicle_id) return null;

  const { data: vehicle } = await adminClient
    .from("ss_vehicles")
    .select("id, owner_id, vehicle_number, brand, model, color, type")
    .eq("id", qrCode.vehicle_id)
    .single();

  if (!vehicle) return null;

  return { qrCode, vehicle };
}

export async function createNotifyScan(qrId: string, message: string): Promise<ActionResult> {
  if (!message.trim()) return { success: false, error: "Please enter a message." };

  const resolved = await resolveActiveQR(qrId);
  if (!resolved) return { success: false, error: "This sticker is not active." };

  const { ip, userAgent } = await getRequestMeta();
  if (await isRateLimited(qrId, ip)) {
    return { success: false, error: "Too many requests. Please try again in a few minutes." };
  }

  const adminClient = createAdminClient();

  const { data: owner } = await adminClient
    .from("ss_users")
    .select("phone, email")
    .eq("id", resolved.vehicle.owner_id)
    .single();

  const { data: scan, error } = await adminClient
    .from("ss_scans")
    .insert({
      qr_id: qrId,
      action_type: "notify_owner",
      scanner_message: message.trim(),
      ip_address: ip,
      user_agent: userAgent,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const vehicleLabel = formatVehicleLabel(resolved.vehicle);
  if (owner?.phone) {
    const body = renderTemplate("notify_owner_sms", { vehicleLabel, message: message.trim() });
    await queueNotification(scan.id, "sms", owner.phone, body);
  }
  if (owner?.email) {
    const body = renderTemplate("notify_owner_email", { vehicleLabel, message: message.trim() });
    await queueNotification(scan.id, "email", owner.email, body);
  }

  return { success: true };
}

export async function createWrongParkingScan(
  qrId: string,
  reason: string,
  note: string,
  lat?: number,
  lng?: number
): Promise<ActionResult> {
  const resolved = await resolveActiveQR(qrId);
  if (!resolved) return { success: false, error: "This sticker is not active." };

  const { ip, userAgent } = await getRequestMeta();
  if (await isRateLimited(qrId, ip)) {
    return { success: false, error: "Too many requests. Please try again in a few minutes." };
  }

  const adminClient = createAdminClient();

  const { data: owner } = await adminClient
    .from("ss_users")
    .select("phone, email")
    .eq("id", resolved.vehicle.owner_id)
    .single();

  const message = [reason, note.trim()].filter(Boolean).join(" — ");

  const { data: scan, error } = await adminClient
    .from("ss_scans")
    .insert({
      qr_id: qrId,
      action_type: "wrong_parking",
      scanner_message: message || reason,
      location_lat: lat ?? null,
      location_lng: lng ?? null,
      ip_address: ip,
      user_agent: userAgent,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const vehicleLabel = formatVehicleLabel(resolved.vehicle);
  const mapsLine = formatMapsLine(lat, lng);
  if (owner?.phone) {
    const body = renderTemplate("wrong_parking_sms", { vehicleLabel, reason: message || reason, mapsLine });
    await queueNotification(scan.id, "sms", owner.phone, body);
  }
  if (owner?.email) {
    const body = renderTemplate("wrong_parking_email", { vehicleLabel, reason: message || reason, mapsLine });
    await queueNotification(scan.id, "email", owner.email, body);
  }

  return { success: true };
}

export async function createEmergencyScan(
  qrId: string,
  note?: string,
  lat?: number,
  lng?: number
): Promise<ActionResult> {
  const resolved = await resolveActiveQR(qrId);
  if (!resolved) return { success: false, error: "This sticker is not active." };

  const { ip, userAgent } = await getRequestMeta();
  if (await isRateLimited(qrId, ip)) {
    return { success: false, error: "Too many requests. Please try again in a few minutes." };
  }

  const adminClient = createAdminClient();

  const [{ data: contacts }, { data: medicalProfile }] = await Promise.all([
    adminClient
      .from("ss_emergency_contacts")
      .select("name, relation, phone, priority_order")
      .eq("vehicle_id", resolved.vehicle.id)
      .order("priority_order", { ascending: true }),
    adminClient
      .rpc("ss_get_medical_profile_admin", { p_vehicle_id: resolved.vehicle.id, p_key: ENCRYPTION_KEY })
      .maybeSingle() as unknown as Promise<{
      data: {
        blood_group: string | null;
        allergies: string | null;
        conditions: string | null;
        consent_given: boolean;
      } | null;
    }>,
  ]);

  const { data: scan, error } = await adminClient
    .from("ss_scans")
    .insert({
      qr_id: qrId,
      action_type: "emergency",
      scanner_message: note?.trim() || null,
      location_lat: lat ?? null,
      location_lng: lng ?? null,
      ip_address: ip,
      user_agent: userAgent,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const vehicleLabel = formatVehicleLabel(resolved.vehicle);
  const mapsLine = formatMapsLine(lat, lng);
  const medicalLine = formatMedicalLine(medicalProfile?.consent_given ? medicalProfile : null);

  for (const contact of contacts ?? []) {
    const smsBody = renderTemplate("emergency_sms", { vehicleLabel, mapsLine, medicalLine });
    await queueNotification(scan.id, "sms", contact.phone, smsBody);
    const whatsappBody = renderTemplate("emergency_whatsapp", { vehicleLabel, mapsLine, medicalLine });
    await queueNotification(scan.id, "whatsapp", contact.phone, whatsappBody);
  }

  return { success: true };
}

export async function resolveScan(scanId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("ss_scans")
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", scanId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getScansForVehicle(vehicleId: string): Promise<Scan[]> {
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("ss_vehicles")
    .select("id")
    .eq("id", vehicleId)
    .single();
  if (!vehicle) return [];

  const { data: qrCode } = await supabase
    .from("ss_qr_codes")
    .select("qr_id")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();
  if (!qrCode) return [];

  const { data: scans } = await supabase
    .from("ss_scans")
    .select("*")
    .eq("qr_id", qrCode.qr_id)
    .order("created_at", { ascending: false });

  return scans ?? [];
}
