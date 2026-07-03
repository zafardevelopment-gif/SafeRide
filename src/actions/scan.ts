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
import { sendEmail } from "@/notifications/email";
import { notifyOwnerEmail, wrongParkingEmail, emergencyAlertEmail } from "@/notifications/email-templates";
import { sendWhatsAppTemplate } from "@/notifications/whatsapp";
import type { ActionResult, NotificationChannel, Scan } from "@/types";

// Meta-approved WhatsApp templates (see Meta Business Manager for exact
// wording). Body params are filled in order — {{1}}, {{2}}, {{3}}.
const WHATSAPP_TEMPLATES = {
  emergency_alert: "emergency_alert",
  wrong_parking_alert: "wrong_parking_alert",
} as const;

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

// Logs every notification attempt, then actually delivers WhatsApp + Email
// via Exotel/Resend. SMS stays queued-only for now — calling/SMS via Exotel
// is a deliberate deferral, added later.
async function queueNotification(
  scanId: string,
  channel: NotificationChannel,
  recipient: string,
  body: string
) {
  const adminClient = createAdminClient();

  // sms — queued only; Exotel SMS/calling wiring comes later
  await adminClient.from("ss_notifications_log").insert({
    scan_id: scanId,
    channel,
    recipient,
    body,
    status: "queued",
  });
}

// Sends the branded HTML email via Resend and logs the attempt. `plainBody`
// is the human-readable version stored in the log for audit.
async function sendEmailNotification(
  scanId: string,
  recipient: string,
  subject: string,
  html: string,
  plainBody: string
) {
  const adminClient = createAdminClient();
  const result = await sendEmail({ to: recipient, subject, html });
  await adminClient.from("ss_notifications_log").insert({
    scan_id: scanId,
    channel: "email",
    recipient,
    body: plainBody,
    status: result.success ? "sent" : "failed",
    provider_message_id: result.messageId ?? null,
    error_message: result.error ?? null,
    sent_at: result.success ? new Date().toISOString() : null,
  });
}

// Sends a business-initiated WhatsApp alert using a Meta-approved template
// (required outside the 24h customer-session window — see notifications/whatsapp.ts).
// `body` is the human-readable version stored in the log for audit; the
// actual WhatsApp send uses templateName + bodyParams instead.
async function sendWhatsAppNotification(
  scanId: string,
  recipient: string,
  body: string,
  templateName: string,
  bodyParams: string[]
) {
  const adminClient = createAdminClient();
  const result = await sendWhatsAppTemplate({ to: recipient, templateName, bodyParams });
  await adminClient.from("ss_notifications_log").insert({
    scan_id: scanId,
    channel: "whatsapp",
    recipient,
    body,
    status: result.success ? "sent" : "failed",
    provider_message_id: result.messageId ?? null,
    error_message: result.error ?? null,
    sent_at: result.success ? new Date().toISOString() : null,
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
    const plainBody = renderTemplate("notify_owner_email", { vehicleLabel, message: message.trim() });
    const { subject, html } = notifyOwnerEmail(vehicleLabel, message.trim());
    await sendEmailNotification(scan.id, owner.email, subject, html, plainBody);
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
  const mapsUrl = lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : "Not shared";
  if (owner?.phone) {
    const smsBody = renderTemplate("wrong_parking_sms", { vehicleLabel, reason: message || reason, mapsLine });
    await queueNotification(scan.id, "sms", owner.phone, smsBody);

    const whatsappBody = renderTemplate("wrong_parking_sms", { vehicleLabel, reason: message || reason, mapsLine });
    await sendWhatsAppNotification(
      scan.id,
      owner.phone,
      whatsappBody,
      WHATSAPP_TEMPLATES.wrong_parking_alert,
      [vehicleLabel, message || reason, mapsUrl]
    );
  }
  if (owner?.email) {
    const plainBody = renderTemplate("wrong_parking_email", { vehicleLabel, reason: message || reason, mapsLine });
    const { subject, html } = wrongParkingEmail(
      vehicleLabel,
      message || reason,
      lat != null && lng != null ? mapsUrl : null
    );
    await sendEmailNotification(scan.id, owner.email, subject, html, plainBody);
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
      .select("name, relation, phone, email, priority_order")
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
  const mapsUrl = lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : "Not shared";
  // Meta templates reject blank variables — fall back to explicit text.
  const medicalParam = medicalLine.trim() || "Not provided";

  for (const contact of contacts ?? []) {
    const smsBody = renderTemplate("emergency_sms", { vehicleLabel, mapsLine, medicalLine });
    await queueNotification(scan.id, "sms", contact.phone, smsBody);

    const whatsappBody = renderTemplate("emergency_whatsapp", { vehicleLabel, mapsLine, medicalLine });
    await sendWhatsAppNotification(
      scan.id,
      contact.phone,
      whatsappBody,
      WHATSAPP_TEMPLATES.emergency_alert,
      [vehicleLabel, mapsUrl, medicalParam]
    );

    if (contact.email) {
      const plainBody = renderTemplate("emergency_email", { vehicleLabel, mapsLine, medicalLine });
      const { subject, html } = emergencyAlertEmail(
        vehicleLabel,
        lat != null && lng != null ? mapsUrl : null,
        medicalLine
      );
      await sendEmailNotification(scan.id, contact.email, subject, html, plainBody);
    }
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

export interface UserScanNotification {
  scan: Scan;
  vehicleNumber: string;
}

/** All recent scans across every vehicle the logged-in user owns — used for in-app notifications. */
export async function getRecentScansForUser(limit = 30): Promise<UserScanNotification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: vehicles } = await supabase
    .from("ss_vehicles")
    .select("id, vehicle_number")
    .eq("owner_id", user.id);
  if (!vehicles || vehicles.length === 0) return [];

  const { data: qrCodes } = await supabase
    .from("ss_qr_codes")
    .select("qr_id, vehicle_id")
    .in(
      "vehicle_id",
      vehicles.map((v) => v.id)
    );
  if (!qrCodes || qrCodes.length === 0) return [];

  const vehicleByQr = new Map(
    qrCodes.map((q) => [
      q.qr_id,
      vehicles.find((v) => v.id === q.vehicle_id)?.vehicle_number ?? "",
    ])
  );

  const { data: scans } = await supabase
    .from("ss_scans")
    .select("*")
    .in(
      "qr_id",
      qrCodes.map((q) => q.qr_id)
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (scans ?? []).map((s) => ({
    scan: s,
    vehicleNumber: vehicleByQr.get(s.qr_id) ?? "",
  }));
}
