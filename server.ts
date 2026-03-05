import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Suggest Comment for Essay
  app.post("/api/ai/suggest-comment", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ error: "Gemini API key is missing or invalid. Please configure it in the Secrets panel." });
      }
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      const { content, studentName } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Đóng vai một giáo viên tiểu học. Hãy nhận xét bài làm sau của học sinh lớp 3 tên là ${studentName || "Học sinh"}.
        Bài làm: "${typeof content === 'object' ? JSON.stringify(content) : content}"
        Tiêu chí: Nội dung, mức độ hoàn thành.
        Hãy đưa ra lời nhận xét mang tính khích lệ, phù hợp với tâm lý trẻ em lớp 3.
        Đồng thời, đánh giá mức độ hoàn thành theo 3 mức: "Hoàn thành tốt", "Hoàn thành", "Chưa hoàn thành".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              comment: {
                type: Type.STRING,
                description: "Lời nhận xét của giáo viên dành cho học sinh.",
              },
              level: {
                type: Type.STRING,
                description: "Mức độ hoàn thành: 'Hoàn thành tốt', 'Hoàn thành', hoặc 'Chưa hoàn thành'.",
              },
            },
            required: ["comment", "level"],
          },
        },
      });

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (error: any) {
      console.error("AI Suggestion Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: AI Analyze Progress
  app.post("/api/ai/analyze-progress", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ error: "Gemini API key is missing or invalid. Please configure it in the Secrets panel." });
      }
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      const { history, studentName } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Đóng vai một chuyên gia giáo dục. Dưới đây là lịch sử điểm số của học sinh lớp 3 tên là ${studentName || "Học sinh"}:
        ${JSON.stringify(history)}
        Hãy phân tích tiến bộ của học sinh:
        1. Tính % cải thiện (nếu có).
        2. Phân loại xu hướng: "Tiến bộ rõ rệt", "Ổn định", hoặc "Cần hỗ trợ thêm".
        3. Viết một đoạn tóm tắt ngắn gọn báo cáo tình hình học tập tháng này.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              improvementPercentage: {
                type: Type.NUMBER,
                description: "Phần trăm cải thiện so với bài đầu tiên.",
              },
              trend: {
                type: Type.STRING,
                description: "Xu hướng: 'Tiến bộ rõ rệt', 'Ổn định', hoặc 'Cần hỗ trợ thêm'.",
              },
              summary: {
                type: Type.STRING,
                description: "Báo cáo tóm tắt ngắn gọn.",
              },
            },
            required: ["improvementPercentage", "trend", "summary"],
          },
        },
      });

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: AI TTS
  app.post("/api/ai/tts", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ error: "Gemini API key is missing or invalid." });
      }
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const { text } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Đọc văn bản sau bằng tiếng Việt: ${text}` }] }],
        config: {
          systemInstruction: "Bạn là một người Việt Nam bản xứ. Hãy đọc văn bản được cung cấp bằng tiếng Việt một cách tự nhiên, rõ ràng, đúng ngữ điệu và trọng âm của tiếng Việt. Chỉ trả về âm thanh của nội dung văn bản.",
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audioData: `data:audio/mp3;base64,${base64Audio}` });
      } else {
        res.status(500).json({ error: "Không thể tạo âm thanh." });
      }
    } catch (error: any) {
      console.error("TTS Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
