// Exotel SMS integration — TRAI-compliant Indian provider
// Docs: https://developer.exotel.com/api/

interface ExotelSMSParams {
  to: string;     // +91XXXXXXXXXX or 0XXXXXXXXXX
  body: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(params: ExotelSMSParams): Promise<SMSResult> {
  const { EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_ACCOUNT_SID, EXOTEL_SENDER_ID } =
    process.env;

  if (!EXOTEL_API_KEY || !EXOTEL_API_TOKEN || !EXOTEL_ACCOUNT_SID) {
    console.warn("[SMS] Exotel credentials not configured — skipping send");
    return { success: false, error: "SMS provider not configured" };
  }

  const credentials = Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString(
    "base64"
  );

  const body = new URLSearchParams({
    From: EXOTEL_SENDER_ID || "SFRQR",
    To: params.to,
    Body: params.body,
  });

  try {
    const res = await fetch(
      `https://api.exotel.com/v1/Accounts/${EXOTEL_ACCOUNT_SID}/Sms/send.json`,
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
    return { success: true, messageId: data.SMSMessage?.Sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
