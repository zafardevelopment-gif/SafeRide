// Email template: Notify Owner
// Used when a scanner sends a general message via the scan page

interface NotifyOwnerEmailProps {
  ownerName: string;
  vehicleNumber: string;
  scannerMessage: string;
  locationUrl?: string;
  timestamp: string;
}

export function notifyOwnerEmailHTML(props: NotifyOwnerEmailProps): string {
  const { ownerName, vehicleNumber, scannerMessage, locationUrl, timestamp } = props;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:16px;color:#1a1a1a">
  <div style="background:#2563eb;padding:16px;border-radius:8px 8px 0 0;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px">SafeRide QR</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p style="font-size:16px">Hi <strong>${ownerName}</strong>,</p>
    <p>Someone scanned your vehicle <strong>${vehicleNumber}</strong> and left you a message:</p>
    <blockquote style="background:#f3f4f6;padding:12px 16px;border-left:4px solid #2563eb;border-radius:4px;margin:16px 0">
      "${scannerMessage}"
    </blockquote>
    ${locationUrl ? `<p><a href="${locationUrl}" style="color:#2563eb">View Location on Google Maps</a></p>` : ""}
    <p style="color:#6b7280;font-size:12px">Scanned at: ${timestamp}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
    <p style="color:#6b7280;font-size:12px">
      You received this because your vehicle is registered on SafeRide QR.
      To manage your alerts, log in to your dashboard.
    </p>
  </div>
</body>
</html>
  `.trim();
}
