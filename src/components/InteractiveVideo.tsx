import React, { useState, useRef } from "react";
import YouTube from "react-youtube";
import { CheckCircle, Volume2 } from "lucide-react";
import { speak } from "../pages/AssignmentView";

export default function InteractiveVideo({ videoUrl, questions, onComplete }: { videoUrl: string, questions: any[], onComplete: (data: any) => void }) {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const playerRef = useRef<any>(null);
  const answeredQuestionsRef = useRef<number[]>([]);

  const videoId = videoUrl ? (videoUrl.split("v=")[1]?.split("&")[0] || videoUrl.split("/").pop()) : "";

  // Notify parent of answers whenever they change
  React.useEffect(() => {
    onComplete(answers);
  }, [answers, onComplete]);

  React.useEffect(() => {
    answeredQuestionsRef.current = answeredQuestions;
  }, [answeredQuestions]);

  const handleStateChange = (event: any) => {
    if (event.data === YouTube.PlayerState.PLAYING) {
      const checkTime = setInterval(() => {
        if (!playerRef.current) return;
        const currentTime = playerRef.current.getCurrentTime();
        const currentAnswered = answeredQuestionsRef.current;
        
        // Check if user seeked past an unanswered question
        const missedQuestion = questions?.find((q, index) => !currentAnswered.includes(index) && currentTime > q.time + 1);
        
        if (missedQuestion) {
          // Force seek back to the missed question
          playerRef.current.seekTo(missedQuestion.time);
          playerRef.current.pauseVideo();
          setCurrentQuestion({ ...missedQuestion, index: questions.indexOf(missedQuestion) });
        } else {
          // Normal playback check
          questions?.forEach((q, index) => {
            if (!currentAnswered.includes(index) && currentTime >= q.time && currentTime < q.time + 1) {
              playerRef.current.pauseVideo();
              setCurrentQuestion({ ...q, index });
            }
          });
        }
      }, 500);
      
      return () => clearInterval(checkTime);
    }
  };

  const handleAnswer = (opt: string) => {
    if (currentQuestion) {
      const newAnswers = { ...answers, [currentQuestion.index]: opt };
      setAnswers(newAnswers);
      const newAnsweredQuestions = [...answeredQuestions, currentQuestion.index];
      setAnsweredQuestions(newAnsweredQuestions);
      answeredQuestionsRef.current = newAnsweredQuestions;
      setCurrentQuestion(null);
      
      if (playerRef.current) {
        playerRef.current.playVideo();
      }
    }
  };

  return (
    <div className="space-y-8">
      {videoId ? (
        <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-video border-4 border-slate-100 shadow-xl">
          <YouTube
            videoId={videoId}
            opts={{ width: "100%", height: "100%", playerVars: { autoplay: 0, controls: 1 } }}
            onStateChange={handleStateChange}
            onReady={(e) => playerRef.current = e.target}
            className="w-full h-full absolute inset-0"
          />
          
          {currentQuestion && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 z-10 animate-in fade-in duration-300">
              <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] max-w-2xl w-full shadow-2xl transform transition-all scale-100 relative max-h-[90vh] overflow-y-auto border-4 border-sky-200">
                <div className="absolute top-0 left-0 w-32 h-32 bg-sky-50 rounded-br-full -z-10"></div>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); speak(currentQuestion.q); }}
                  className="absolute top-6 right-6 p-3 text-sky-500 hover:bg-sky-100 rounded-2xl transition-all hover:scale-110 active:scale-95 bg-slate-50 border-2 border-slate-100"
                  title="Đọc câu hỏi"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
                <h3 className="text-3xl font-black text-slate-800 mb-8 pr-16 leading-tight">{currentQuestion.q}</h3>
                {currentQuestion.imageUrl && (
                  <div className="mb-8 rounded-[2rem] overflow-hidden border-4 border-slate-100 shadow-sm">
                    <img src={currentQuestion.imageUrl} alt="Question image" className="w-full h-auto max-h-[300px] object-contain bg-slate-50" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="space-y-4">
                  {currentQuestion.options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className="w-full text-left px-8 py-5 rounded-[1.5rem] border-4 border-slate-100 hover:border-sky-400 hover:bg-sky-50 hover:shadow-md hover:-translate-y-1 transition-all font-bold text-xl text-slate-700 flex items-center gap-4 group"
                    >
                      <div className="w-8 h-8 rounded-full border-4 border-slate-300 group-hover:border-sky-400 flex-shrink-0 transition-colors"></div>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-100 p-8 rounded-2xl text-center text-slate-500">
          Không có video.
        </div>
      )}

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-800 mb-1">Tiến độ trả lời câu hỏi</h4>
          <p className="text-sm text-slate-500 font-medium">{answeredQuestions.length} / {questions?.length || 0} câu đã trả lời</p>
        </div>
        <div className="flex gap-2">
          {questions?.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${answeredQuestions.includes(i) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
