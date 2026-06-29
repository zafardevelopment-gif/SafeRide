// Exotel WhatsApp Business API integration
// Uses the same Exotel account — separate WhatsApp number required

interface WhatsAppParams {
  to: string;     // +91XXXXXXXXXX
  body: string;
}

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsApp(params: WhatsAppParams): Promise<WhatsAppResult> {
  const {
    EXOTEL_API_KEY,
    EXOTEL_API_TOKEN,
    EXOTEL_ACCOUNT_SID,
    EXOTEL_WHATSAPP_NUMBER,
  } = process.env;

  if (!EXOTEL_API_KEY || !EXOTEL_API_TOKEN || !EXOTEL_ACCOUNT_SID || !EXOTEL_WHATSAPP_NUMBER) {
    console.warn("[WhatsApp] Exotel WhatsApp credentials not configured — skipping");
    return { success: false, error: "WhatsApp provider not configured" };
  }

  const credentials = Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString(
    "base64"
  );

  const body = new URLSearchParams({
    From: EXOTEL_WHATSAPP_NUMBER,
    To: params.to,
    Body: params.body,
  });

  try {
    const res = await fetch(
      `https://api.exotel.com/v1/Accounts/${EXOTEL_ACCOUNT_SID}/Messages/send_whatsapp.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text };
    }

    const data = await res.json();
    return { success: true, messageId: data.Message?.Sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
