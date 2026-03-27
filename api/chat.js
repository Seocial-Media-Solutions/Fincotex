// api/chat.js — Vercel Serverless Function
// Yeh file /api/chat endpoint ban jaati hai automatically Vercel pe

export default async function handler(req, res) {
  // CORS headers — zaroori hai browser se call ke liye
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS preflight request handle karo
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const SYSTEM_PROMPT = `You are FINCOTIX AI, a financial decision intelligence system.
IMPORTANT RULES:
- Do NOT give direct financial advice
- Do NOT say "you should invest"
- Only provide insights, risks, and scenario-based observations
- Use neutral language: "may", "could", "based on inputs"
- Keep responses concise (2-4 sentences max)
- Be helpful, clear, and professional
- You can respond in Hindi or English based on user's language`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI error:", data.error);
      return res.status(500).json({ reply: "API error. Please check your OpenAI key in Vercel settings." });
    }

    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ reply: "Something went wrong. Please try again." });
  }
}