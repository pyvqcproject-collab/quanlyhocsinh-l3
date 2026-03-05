import { GoogleGenAI, Modality } from "@google/genai";

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        systemInstruction: "Bạn là một người dẫn chương trình chuyên nghiệp người Việt Nam. Hãy đọc đoạn văn bản được cung cấp bằng giọng miền Nam Việt Nam chuẩn, truyền cảm, rõ ràng, tốc độ vừa phải. Chỉ đọc nội dung văn bản, không thêm bớt lời dẫn.",
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Kore' or 'Zephyr' are generally good, but 'Kore' is often recommended for feminine/clear voices
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/wav;base64,${base64Audio}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}
