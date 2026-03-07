import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/api/ai/suggest-comment", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(500).json({ error: "Gemini API key is missing or invalid." });
    }
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const { content, studentName, assignment } = req.body;
    const assignmentContext = assignment ? `Thông tin bài tập:\n- Tiêu đề: ${assignment.title}\n- Yêu cầu: ${assignment.description}\n- Loại bài tập: ${assignment.type}` : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Đóng vai một giáo viên tiểu học. Hãy nhận xét bài làm sau của học sinh lớp 3 tên là ${studentName || "Học sinh"}.\n${assignmentContext}\nBài làm: "${typeof content === 'object' ? JSON.stringify(content) : content}"\nTiêu chí: Nội dung, mức độ hoàn thành.\nHãy đưa ra lời nhận xét mang tính khích lệ, phù hợp với tâm lý trẻ em lớp 3.\nĐồng thời, đánh giá mức độ hoàn thành theo 3 mức: "Hoàn thành tốt", "Hoàn thành", "Chưa hoàn thành".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            comment: { type: Type.STRING },
            level: { type: Type.STRING },
          },
          required: ["comment", "level"],
        },
      },
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/analyze-progress", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(500).json({ error: "Gemini API key is missing or invalid." });
    }
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const { history, studentName } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Đóng vai một chuyên gia giáo dục. Dưới đây là lịch sử điểm số của học sinh lớp 3 tên là ${studentName || "Học sinh"}:\n${JSON.stringify(history)}\nHãy phân tích tiến bộ của học sinh:\n1. Tính % cải thiện (nếu có).\n2. Phân loại xu hướng: "Tiến bộ rõ rệt", "Ổn định", hoặc "Cần hỗ trợ thêm".\n3. Viết một đoạn tóm tắt ngắn gọn báo cáo tình hình học tập tháng này.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            improvementPercentage: { type: Type.NUMBER },
            trend: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ["improvementPercentage", "trend", "summary"],
        },
      },
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
