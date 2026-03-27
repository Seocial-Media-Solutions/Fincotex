const express = require('express');
const app = express();
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Use gemini-pro for maximum compatibility
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    if (!message) return res.status(400).json({ error: "Message required" });

    try {
        console.log("Input Message:", message);
        
        // Combine system prompt and user message directly for gemini-pro (v1/v1beta compatibility)
        const prompt = `${SYSTEM_PROMPT}\n\nUser Question: ${message}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return res.status(200).json({ reply: text });
    } catch (err) {
        console.error("Gemini Error:", err.message);
        
        // Handle specific 404/Not Found errors
        if (err.message.includes("404") || err.message.includes("not found")) {
            return res.status(500).json({ 
                reply: "The AI model 'gemini-pro' could not be found. This usually means your API Key is restricted or your regional account doesn't support this model yet." 
            });
        }
        
        return res.status(500).json({ reply: "I'm having trouble connecting to the AI. Please verify your GEMINI_API_KEY in the .env file." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Using Gemini API Key starting with:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : "MISSING");
});
