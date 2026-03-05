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
    if (audio) {
      audio.play();
      return;
    }

    if (!text || text.trim() === "") return;

    setIsLoading(true);
    try {
      const audioData = await generateSpeech(text);
      if (audioData) {
        const newAudio = new Audio(audioData);
        setAudio(newAudio);
        newAudio.play();
      }
    } catch (error) {
      console.error("Failed to play TTS:", error);
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
