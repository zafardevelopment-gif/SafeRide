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

async function postToExotel(payload: URLSearchParams): Promise<WhatsAppResult> {
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

  const credentials = Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString("base64");
  payload.set("From", EXOTEL_WHATSAPP_NUMBER);

  try {
    const res = await fetch(
      `https://api.exotel.com/v1/Accounts/${EXOTEL_ACCOUNT_SID}/Messages/send_whatsapp.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
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

// Free-form send — only works inside the 24h session window (i.e. the
// recipient messaged us first). Business-initiated alerts must use
// sendWhatsAppTemplate below with a Meta-approved template.
export async function sendWhatsApp(params: WhatsAppParams): Promise<WhatsAppResult> {
  const body = new URLSearchParams({ To: params.to, Body: params.body });
  return postToExotel(body);
}

interface WhatsAppTemplateParams {
  to: string;              // +91XXXXXXXXXX
  templateName: string;    // must exactly match the Meta-approved template name
  languageCode?: string;   // defaults to en
  bodyParams: string[];    // fills {{1}}, {{2}}, ... in order
}

// Business-initiated send using a Meta-approved WhatsApp template.
// NOTE: verify field names (Template/Language/BodyParameters) against
// Exotel's WhatsApp template-send docs before going live — this follows
// their documented send_whatsapp.json pattern but template support may
// use slightly different field names depending on your Exotel plan.
export async function sendWhatsAppTemplate(params: WhatsAppTemplateParams): Promise<WhatsAppResult> {
  const body = new URLSearchParams({
    To: params.to,
    Template: params.templateName,
    Language: params.languageCode ?? "en",
    BodyParameters: JSON.stringify(params.bodyParams),
  });
  return postToExotel(body);
}
