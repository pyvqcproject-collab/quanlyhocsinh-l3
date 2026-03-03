import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAssignment, submitAssignment } from "../firebase/db";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, CheckCircle, Volume2, Image as ImageIcon, X, Clock, PenTool } from "lucide-react";
import DrawingCanvas from "../components/DrawingCanvas";
import InteractiveVideo from "../components/InteractiveVideo";

export const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    
    // Try to find a Vietnamese voice, preferably a Southern one if available
    const voices = window.speechSynthesis.getVoices();
    const viVoices = voices.filter(v => v.lang.includes('vi'));
    // Some systems might have specific names for Southern voices, but we'll just pick the first vi-VN voice
    // as browser support for specific regional accents is limited and depends on the OS.
    if (viVoices.length > 0) {
      utterance.voice = viVoices[0];
    }
    
    window.speechSynthesis.speak(utterance);
  } else {
    alert("Trình duyệt của bạn không hỗ trợ đọc văn bản.");
  }
};

export function TTSButton({ text, className = "" }: { text: string, className?: string }) {
  return (
    <button 
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); speak(text); }}
      className={`p-2 text-sky-500 hover:bg-sky-100 rounded-full transition-colors ${className}`}
      title="Đọc câu hỏi"
    >
      <Volume2 className="w-5 h-5" />
    </button>
  );
}

export default function AssignmentView() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<any>(null);
  const [content, setContent] = useState("");
  const [videoAnswers, setVideoAnswers] = useState<Record<number, string>>({});
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      getAssignment(id).then(setAssignment);
    }
    
    // Load voices early
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, [id]);

  if (!assignment) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files as Iterable<File>).forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setAttachedImages(prev => [...prev, evt.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    
    // Combine data with attached images
    let finalContent = data;
    if (attachedImages.length > 0) {
      if (typeof data === 'string') {
        finalContent = { text: data, images: attachedImages };
      } else if (typeof data === 'object') {
        finalContent = { ...data, images: attachedImages };
      }
    }

    await submitAssignment({
      assignmentId: assignment.id,
      studentId: user.id,
      content: finalContent,
    });
    setSubmitting(false);
    navigate("/dashboard");
  };

  const ImageUploader = () => (
    <div className="mt-8 border-t-4 border-slate-100 pt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-sky-500" /> Đính kèm ảnh trả lời
        </h3>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-6 py-3 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 border-2 border-sky-200"
        >
          <ImageIcon className="w-5 h-5" /> Chọn ảnh
        </button>
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
      </div>
      
      {attachedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {attachedImages.map((img, i) => (
            <div key={i} className="relative group aspect-square rounded-[2rem] overflow-hidden border-4 border-slate-200 hover:border-sky-400 transition-colors shadow-sm">
              <img src={img} alt={`Đính kèm ${i+1}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => removeImage(i)}
                className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 hover:scale-110 active:scale-90 shadow-md"
              >
                <X className="w-5 h-5 text-white font-bold" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b-4 border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-slate-500 hover:text-sky-600 font-bold transition-colors bg-slate-100 hover:bg-sky-100 px-4 py-2 rounded-2xl">
            <ArrowLeft className="w-5 h-5" /> Quay lại
          </button>
          <h1 className="text-2xl font-black text-slate-800 truncate max-w-[200px] sm:max-w-md">{assignment.title}</h1>
          <div className="w-24"></div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl border-4 border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sky-100 to-transparent rounded-bl-full -z-10"></div>
          
          <div className="mb-10">
            <span className={`inline-block px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider mb-6 border-2 ${assignment.type === 'essay' ? 'bg-amber-100 text-amber-700 border-amber-200' : assignment.type === 'video' ? 'bg-rose-100 text-rose-700 border-rose-200' : assignment.type === 'drawing' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-sky-100 text-sky-700 border-sky-200'}`}>
              {assignment.type === 'essay' ? 'Tự luận' : assignment.type === 'video' ? 'Video' : assignment.type === 'drawing' ? 'Vẽ tranh' : 'Trắc nghiệm'}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-4 flex items-center gap-4 leading-tight">
              {assignment.title}
              <TTSButton text={assignment.title} className="scale-125 ml-2" />
            </h2>
            <p className="text-slate-500 font-bold text-lg mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-500" /> Hạn nộp: {assignment.dueDate}
            </p>
            {assignment.description && (
              <div className="bg-sky-50 p-6 sm:p-8 rounded-[2rem] border-4 border-sky-100 mb-8 relative">
                <div className="absolute top-6 right-6">
                  <TTSButton text={assignment.description} className="bg-white shadow-sm" />
                </div>
                <p className="text-slate-700 whitespace-pre-wrap text-xl leading-relaxed pr-12 font-medium">{assignment.description}</p>
              </div>
            )}
            {assignment.imageUrl && (
              <div className="mb-8 rounded-[2rem] overflow-hidden border-4 border-slate-100 shadow-sm">
                <img src={assignment.imageUrl} alt="Assignment image" className="w-full h-auto max-h-[500px] object-contain bg-slate-50" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>

          {assignment.type === "essay" && (
            <div className="space-y-8">
              <p className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <PenTool className="w-6 h-6 text-amber-500" /> Hãy viết bài làm của em vào ô bên dưới nhé:
              </p>
              <textarea 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                className="w-full h-64 p-6 rounded-[2rem] border-4 border-slate-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 outline-none text-xl resize-none transition-all font-medium"
                placeholder="Bắt đầu viết tại đây..."
              />
              <ImageUploader />
              <button 
                onClick={() => handleSubmit(content)} 
                disabled={(!content.trim() && attachedImages.length === 0) || submitting}
                className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 mx-auto mt-8"
              >
                <CheckCircle className="w-8 h-8" /> Nộp bài ngay!
              </button>
            </div>
          )}

          {assignment.type === "drawing" && (
            <div className="space-y-6">
              <DrawingCanvas onSubmit={handleSubmit} submitting={submitting}>
                <ImageUploader />
              </DrawingCanvas>
            </div>
          )}

          {assignment.type === "video" && (
            <div className="space-y-6">
              <InteractiveVideo videoUrl={assignment.videoUrl} questions={assignment.questions} onComplete={setVideoAnswers} />
              <ImageUploader />
              <button 
                onClick={() => handleSubmit(videoAnswers)} 
                disabled={submitting || (assignment.questions?.length > 0 && Object.keys(videoAnswers).length < assignment.questions.length)}
                className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 mx-auto mt-8"
              >
                <CheckCircle className="w-8 h-8" /> Nộp bài ngay!
              </button>
            </div>
          )}

          {assignment.type === "quiz" && (
            <div className="space-y-8">
              <Quiz questions={assignment.questions} onComplete={setVideoAnswers} />
              <ImageUploader />
              <button 
                onClick={() => handleSubmit(videoAnswers)} 
                disabled={submitting || (assignment.questions?.length > 0 && Object.keys(videoAnswers).length < assignment.questions.length)}
                className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 mx-auto mt-8"
              >
                <CheckCircle className="w-8 h-8" /> Nộp bài ngay!
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Quiz({ questions, onComplete }: any) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  useEffect(() => {
    onComplete(answers);
  }, [answers, onComplete]);

  const handleSelect = (qIndex: number, opt: string) => {
    setAnswers(prev => ({ ...prev, [qIndex]: opt }));
  };

  return (
    <div className="space-y-10">
      {questions?.map((q: any, i: number) => (
        <div key={i} className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-16 h-16 bg-sky-100 rounded-br-[2rem] flex items-center justify-center text-sky-600 font-black text-2xl">
            {i + 1}
          </div>
          <div className="absolute top-6 right-6">
            <TTSButton text={q.q} className="bg-slate-50 border-2 border-slate-100" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-6 mt-12 pr-12 leading-relaxed">{q.q}</h3>
          {q.imageUrl && (
            <div className="mb-8 rounded-[2rem] overflow-hidden border-4 border-slate-100">
              <img src={q.imageUrl} alt="Question image" className="w-full h-auto max-h-[400px] object-contain bg-slate-50" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="space-y-4">
            {q.options?.map((opt: string) => (
              <label key={opt} className={`flex items-center gap-4 p-5 rounded-[1.5rem] border-4 cursor-pointer transition-all hover:-translate-y-1 ${answers[i] === opt ? 'border-sky-400 bg-sky-50 text-sky-700 shadow-md' : 'border-slate-100 hover:border-sky-200 bg-white'}`}>
                <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center flex-shrink-0 transition-colors ${answers[i] === opt ? 'border-sky-500 bg-sky-500' : 'border-slate-300'}`}>
                  {answers[i] === opt && <div className="w-3 h-3 bg-white rounded-full"></div>}
                </div>
                <input type="radio" name={`q-${i}`} value={opt} checked={answers[i] === opt} onChange={() => handleSelect(i, opt)} className="hidden" />
                <span className="text-xl font-bold">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
