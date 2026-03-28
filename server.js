const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `You are FINCOTIX AI, a financial decision intelligence system.
IMPORTANT RULES:
- Do NOT give direct financial advice
- Do NOT say "you should invest"
- Only provide insights, risks, and scenario-based observations
- Use neutral language: "may", "could", "based on inputs"
- Keep responses concise (2-4 sentences max)
- Be helpful, clear, and professional
- You can respond in Hindi or English based on user's language`;

app.get('/', (req, res) => {
    res.render('index', { title: 'FINCOTEX AI' });
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ reply: "⚠️ GROQ_API_KEY is missing in your .env file." });
    }

    try {
        console.log("Using Groq API (llama-3.3-70b-versatile)...");

        const payload = {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: message }
            ],
            max_tokens: 300
        };

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("Groq API Error:", data.error);

            // Handle rate limiting
            if (data.error.code === "rate_limit_exceeded" || response.status === 429) {
                return res.status(429).json({ reply: "⏳ Rate limit reached. Please wait a moment before trying again." });
            }

            return res.status(500).json({ reply: `❌ API Error: ${data.error.message}` });
        }

        const reply = data.choices?.[0]?.message?.content || "No reply from AI.";
        return res.status(200).json({ reply });

    } catch (err) {
        console.error("Server Error:", err);
        return res.status(500).json({ reply: "❌ Connection Error. Please verify your internet and GROQ_API_KEY." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔑 Groq Key check: ${process.env.GROQ_API_KEY ? 'Present ✅' : 'MISSING ❌'}\n`);
});