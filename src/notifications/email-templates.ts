/**
 * Branded transactional email templates for SafeRide QR.
 * All templates share one responsive, inline-styled wrapper (email-client safe).
 */

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://saferide.aivexallp.com";
const SUPPORT_PHONE = "+91 92042 98771";

function wrapper(content: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2563eb,#06b6d4);padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🛡️ SafeRide QR</p>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85);">Smart Vehicle Protection · Made for India</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            Need help? Call/WhatsApp <a href="tel:+919204298771" style="color:#2563eb;text-decoration:none;">${SUPPORT_PHONE}</a>
            · <a href="${APP_URL}/contact" style="color:#2563eb;text-decoration:none;">Contact us</a>
          </p>
          <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">© ${new Date().getFullYear()} SafeRide QR · <a href="${APP_URL}" style="color:#94a3b8;text-decoration:none;">saferide.aivexallp.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;"><tr><td style="border-radius:999px;background:linear-gradient(90deg,#2563eb,#3b82f6);">
    <a href="${href}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
  </td></tr></table>`;
}

export function welcomeCustomerEmail(name: string | null): { subject: string; html: string } {
  const firstName = name?.split(" ")[0] ?? "Rider";
  return {
    subject: `Welcome to SafeRide QR, ${firstName}! 🎉`,
    html: wrapper(
      `<h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Welcome aboard, ${firstName}! 👋</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        Your SafeRide QR account is ready. Yahan se aapki vehicle hamesha connected rahegi —
        koi bhi aapke sticker ko scan karke aapko alert kar sakta hai, <strong>bina aapka number dekhe</strong>.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 10px;font-size:13px;color:#0f172a;"><strong>3 easy steps:</strong></p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">1️⃣ &nbsp;Apni vehicle add karein</p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">2️⃣ &nbsp;QR sticker scan karke activate karein</p>
          <p style="margin:0;font-size:13px;color:#475569;">3️⃣ &nbsp;Emergency contacts add karein — done! 🛡️</p>
        </td></tr>
      </table>
      ${ctaButton(`${APP_URL}/dashboard`, "Go to Dashboard →")}`,
      "Your vehicle's new bodyguard is ready 🛡️"
    ),
  };
}

export function welcomeAgentEmail(name: string | null): { subject: string; html: string } {
  const firstName = name?.split(" ")[0] ?? "Partner";
  return {
    subject: `Welcome to the SafeRide QR Agent Network, ${firstName}! 🤝`,
    html: wrapper(
      `<h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Welcome, ${firstName}! 🤝</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        Aap ab SafeRide QR ke <strong>official agent</strong> hain. Har sticker jo aapke referral se
        activate hota hai, uspar aapko commission milta hai — seedha aapke account me track hota hai.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 10px;font-size:13px;color:#0f172a;"><strong>Aise kamayein:</strong></p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">🔗 &nbsp;Apna referral link share karein</p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">🏷️ &nbsp;Stickers offline bechein</p>
          <p style="margin:0;font-size:13px;color:#475569;">💰 &nbsp;Har activation par commission paayein</p>
        </td></tr>
      </table>
      ${ctaButton(`${APP_URL}/agent`, "Open Agent Portal →")}`,
      "Start earning with every sticker activation 💰"
    ),
  };
}

export function qrActivatedEmail(
  name: string | null,
  vehicleNumber: string,
  qrId: string
): { subject: string; html: string } {
  const firstName = name?.split(" ")[0] ?? "Rider";
  return {
    subject: `🛡️ ${vehicleNumber} is now protected!`,
    html: wrapper(
      `<h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Sticker activated! ✅</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
        ${firstName}, aapki vehicle <strong>${vehicleNumber}</strong> ab SafeRide QR se protected hai.
        Sticker code: <strong style="font-family:monospace;">SRQ-${qrId}</strong>
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-size:13px;line-height:1.7;color:#166534;">
            Ab koi bhi aapke sticker ko scan karke aapko alert kar sakta hai — lights on,
            wrong parking, ya emergency me. Aapka number hamesha private rehta hai 🔒
          </p>
        </td></tr>
      </table>
      ${ctaButton(`${APP_URL}/dashboard/stickers`, "View My Stickers →")}`,
      `${vehicleNumber} is now under SafeRide protection ✅`
    ),
  };
}
