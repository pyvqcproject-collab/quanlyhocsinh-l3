import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { generateSpeech } from '../services/ttsService';

interface TTSButtonProps {
  text: string;
  className?: string;
}

export const TTSButton: React.FC<TTSButtonProps> = ({ text, className = "" }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (!text || text.trim() === "") return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam'));

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      if (viVoice) utterance.voice = viVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsLoading(true);
      utterance.onend = () => setIsLoading(false);
      utterance.onerror = (e) => {
        console.error("SpeechSynthesis error:", e);
        setIsLoading(false);
        handleGeminiFallback();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      await handleGeminiFallback();
    }
  };

  const handleGeminiFallback = async () => {
    if (audio) {
      audio.play();
      return;
    }

    setIsLoading(true);
    try {
      const audioData = await generateSpeech(text);
      if (audioData) {
        const newAudio = new Audio(audioData);
        setAudio(newAudio);
        newAudio.play();
      }
    } catch (error) {
      console.error("Failed to play Gemini TTS fallback:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading}
      className={`p-2 rounded-full hover:bg-slate-100 transition-colors text-sky-600 disabled:opacity-50 ${className}`}
      title="Nghe nội dung"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  );
};
