
export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const response = await fetch("/api/ai/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate speech");
    }

    const data = await response.json();
    return data.audioData;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}
