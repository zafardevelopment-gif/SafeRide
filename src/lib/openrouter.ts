// OpenRouter chat completions — OpenAI-compatible endpoint.
// Docs: https://openrouter.ai/api/documentation

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResult {
  success: boolean;
  reply?: string;
  error?: string;
}

export async function askChatbot(messages: ChatMessage[]): Promise<ChatResult> {
  const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = process.env;

  if (!OPENROUTER_API_KEY) {
    console.warn("[Chatbot] OPENROUTER_API_KEY not configured — skipping");
    return { success: false, error: "Chatbot is not configured yet." };
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://saferideqr.in",
        "X-Title": process.env.NEXT_PUBLIC_APP_NAME ?? "SafeRide QR",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content as string | undefined;
    if (!reply) return { success: false, error: "No response from chatbot." };

    return { success: true, reply };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
