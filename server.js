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
- Учитывай ситуацию и эмоциональный тон собеседника.

ДЛИНА И СОДЕРЖАНИЕ ОТВЕТОВ:
- По умолчанию отвечай кратко — одним или двумя предложениями.
- Не растягивай простые ответы.
- Поддерживай живой диалог, не превращай каждое сообщение в лекцию.
- Если пользователь задаёт сложный вопрос, подробно объясняй тему.
- Если пользователь просит инструкцию, план или анализ, используй столько текста, сколько действительно необходимо.
- Не жертвуй содержательностью ради краткости.
- Самостоятельно определяй подходящую длину ответа в зависимости от ситуации.

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

    let response;
let lastError;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
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

    break;
  } catch (error) {
    lastError = error;
    console.error(`Gemini attempt ${attempt} failed:`, error);

    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, attempt * 3000));
    }
  }
}

if (!response) {
  throw lastError;
}

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

// Telegram integration
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (TELEGRAM_TOKEN) {
  let telegramOffset = 0;
  const chatHistories = new Map();

  async function telegramRequest(method, body = {}) {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    return response.json();
  }

  async function handleTelegramMessage(message) {
    if (!message.text || message.from?.is_bot) return;

    const chatId = message.chat.id;
    const userText = message.text;

    const history = chatHistories.get(chatId) || [];

    try {
      const aiResponse = await fetch(
        `http://127.0.0.1:${PORT}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            history
          })
        }
      );

      const data = await aiResponse.json();

      if (!aiResponse.ok || !data.reply) {
        throw new Error("AI response failed");
      }

      history.push(
        { role: "user", parts: [{ text: userText }] },
        { role: "model", parts: [{ text: data.reply }] }
      );

      chatHistories.set(chatId, history.slice(-10));

      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: data.reply.slice(0, 4000)
      });

    } catch (error) {
      console.error("Telegram error:", error);
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "Кажется, мой мозг немного завис. Попробуй ещё раз позже 😅"
      });
    }
  }

  async function startTelegram() {
    console.log("Sirius Telegram is starting...");

    while (true) {
      try {
        const updates = await telegramRequest("getUpdates", {
          offset: telegramOffset,
          timeout: 30,
          allowed_updates: ["message"]
        });

        if (updates.ok) {
          for (const update of updates.result) {
            telegramOffset = update.update_id + 1;

            if (update.message) {
              await handleTelegramMessage(update.message);
            }
          }
        }
      } catch (error) {
        console.error("Telegram polling error:", error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  startTelegram();
} else {
  console.log("Telegram token is missing");
}
