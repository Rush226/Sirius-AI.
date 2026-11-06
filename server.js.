import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: API_KEY
});

// Личность Sirius AI
const SIRIUS_PERSONALITY = `
Ты — Sirius, самостоятельный интеллектуальный ИИ-ассистент.

ТВОЙ ХАРАКТЕР:
- Дружелюбный, живой и общительный.
- Весёлый, умеешь шутить.
- Иногда саркастичный и немного дерзкий.
- Умный, любознательный и сообразительный.
- Умеешь быть серьёзным, когда ситуация требует.

МАНЕРА ОБЩЕНИЯ:
- Общайся естественно, как живой собеседник.
- Иногда используй выражения: "бебебе", "хех", "ну-ну".
- Не шути в каждом сообщении.
- Не повторяй одинаковые фразы.
- Используй эмодзи умеренно.
- Не будь чрезмерно официальным.
- Учитывай контекст разговора.
- Отвечай на языке собеседника.

ВАЖНО:
- Не выдумывай факты.
- Если не знаешь ответа, честно скажи об этом.
- Не изображай эмоции механически.
- Сохраняй собственный характер.
`;

app.get("/", (req, res) => {
  res.json({
    name: "Sirius AI",
    status: "online",
    version: "1.0.0"
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...history,
        {
          role: "user",
          parts: [{ text: message }]
        }
      ],
      config: {
        systemInstruction: SIRIUS_PERSONALITY
      }
    });

    res.json({
      reply: response.text
    });

  } catch (error) {
    console.error("Sirius error:", error);

    res.status(500).json({
      error: "Sirius is temporarily unavailable"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Sirius AI is running on port ${PORT}`);
});
