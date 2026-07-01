// Notification message templates with {{variable}} substitution.
// Rendered output is stored on ss_notifications_log.body for audit —
// actual sending (Exotel/Resend) is a deliberate deferral (see src/actions/scan.ts).

type TemplateVars = Record<string, string>;

function render(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);
}

const templates = {
  notify_owner_sms:
    "SafeRide QR: Someone scanned your {{vehicleLabel}} sticker and left a message: \"{{message}}\"",
  notify_owner_email:
    "Hello,\n\nSomeone scanned the SafeRide QR sticker on your {{vehicleLabel}} and left this message:\n\n\"{{message}}\"\n\n— SafeRide QR",

  wrong_parking_sms:
    "SafeRide QR: Your {{vehicleLabel}} was reported for wrong parking — {{reason}}.{{mapsLine}}",
  wrong_parking_email:
    "Hello,\n\nYour {{vehicleLabel}} was reported for a parking issue:\n\n{{reason}}\n{{mapsLine}}\n\n— SafeRide QR",

  emergency_sms:
    "SafeRide QR EMERGENCY: {{vehicleLabel}} — an emergency was reported.{{mapsLine}}{{medicalLine}} Contact the owner immediately.",
  emergency_whatsapp:
    "🚨 SafeRide QR Emergency Alert\n\nVehicle: {{vehicleLabel}}\n{{mapsLine}}{{medicalLine}}\n\nPlease reach out or head to the location immediately.",
} as const;

export type TemplateName = keyof typeof templates;

export function renderTemplate(name: TemplateName, vars: TemplateVars): string {
  return render(templates[name], vars);
}

export function formatVehicleLabel(vehicle: {
  vehicle_number: string;
  brand: string;
  model: string;
}): string {
  return `${vehicle.brand} ${vehicle.model} (${vehicle.vehicle_number})`;
}

export function formatMapsLine(lat?: number | null, lng?: number | null): string {
  if (lat == null || lng == null) return "";
  return ` Location: https://www.google.com/maps?q=${lat},${lng}`;
}

export function formatMedicalLine(medical?: {
  blood_group?: string | null;
  allergies?: string | null;
  conditions?: string | null;
} | null): string {
  if (!medical) return "";
  const parts = [
    medical.blood_group ? `Blood group: ${medical.blood_group}` : null,
    medical.allergies ? `Allergies: ${medical.allergies}` : null,
    medical.conditions ? `Conditions: ${medical.conditions}` : null,
  ].filter(Boolean);
  return parts.length ? ` ${parts.join(", ")}.` : "";
}
