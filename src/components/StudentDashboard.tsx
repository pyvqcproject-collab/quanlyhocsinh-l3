import { useState, useEffect } from "react";
import { getAssignments, getSubmissions, getBadges, updateStudent, addBadge } from "../firebase/db";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { PlayCircle, CheckCircle, Star, Trophy, Clock, FileText, PenTool, Video, ArrowLeft, Gift, X } from "lucide-react";
import confetti from "canvas-confetti";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [localSpinsUsed, setLocalSpinsUsed] = useState(0);
  
  const [showWheel, setShowWheel] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const prizes = [
    "10 điểm thưởng",
    "Huy hiệu Chăm chỉ",
    "Huy hiệu Thông thái",
    "Kẹo",
    "Thêm 1 lượt quay",
    "Snack"
  ];

  useEffect(() => {
    if (user) {
      loadData();
      setLocalSpinsUsed(user.spinsUsed || 0);
    }
  }, [user]);

  const loadData = async () => {
    const as = await getAssignments();
    const su = await getSubmissions(undefined, user.id);
    const ba = await getBadges(user.id);
    setAssignments(as);
    setSubmissions(su);
    setBadges(ba);
  };

  const pendingAssignments = assignments.filter(a => !submissions.find(s => s.assignmentId === a.id));
  const completedAssignments = assignments.filter(a => submissions.find(s => s.assignmentId === a.id));

  const totalStars = submissions.reduce((acc, sub) => acc + (sub.stars || 0), 0);
  const availableStars = totalStars - (localSpinsUsed * 5);

  const spinWheel = async () => {
    if (availableStars < 5 || isSpinning) return;
    
    setIsSpinning(true);
    setPrize(null);
    
    const newSpinsUsed = localSpinsUsed + 1;
    setLocalSpinsUsed(newSpinsUsed);
    await updateStudent(user.id, { spinsUsed: newSpinsUsed });
    
    const extraSpins = 5; // number of full rotations
    const randomDegree = Math.floor(Math.random() * 360);
    const newRotation = rotation + (extraSpins * 360) + randomDegree;
    setRotation(newRotation);
    
    setTimeout(async () => {
      setIsSpinning(false);
      const degrees = newRotation % 360;
      const segment = 360 / prizes.length;
      // Calculate which segment is at the top (0 degrees)
      // The wheel rotates clockwise, so the top segment moves counter-clockwise relative to the wheel
      const index = Math.floor((360 - degrees + (segment / 2)) % 360 / segment);
      const wonPrize = prizes[index];
      setPrize(wonPrize);
      
      if (wonPrize !== "Snack") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981']
        });
      }
      
      if (wonPrize === "Thêm 1 lượt quay") {
        setLocalSpinsUsed(prev => prev - 1);
        await updateStudent(user.id, { spinsUsed: newSpinsUsed - 1 });
      } else if (wonPrize.includes("Huy hiệu")) {
        await addBadge({ studentId: user.id, name: wonPrize, icon: "🌟" });
        loadData();
      }
    }, 4000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-300 via-orange-400 to-rose-400 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-xl relative overflow-hidden border-4 border-white">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-8">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl transform hover:rotate-12 transition-transform" />
          ) : (
            <div className="w-28 h-28 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white font-black text-5xl shadow-2xl border-4 border-white transform hover:rotate-12 transition-transform">
              {user?.name ? user.name.charAt(0) : 'HS'}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h2 className="text-4xl sm:text-5xl font-black mb-3 drop-shadow-md">Chào bé {user?.name}! 👋</h2>
            <p className="text-white/90 text-xl font-medium mb-6 drop-shadow-sm">Hôm nay chúng ta học môn gì nào? 🚀</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
              <div className="bg-white/20 backdrop-blur-md rounded-3xl p-4 flex items-center gap-4 border-2 border-white/30 hover:bg-white/30 transition-colors cursor-pointer" onClick={() => setShowWheel(true)}>
                <div className="bg-amber-400 p-3 rounded-2xl shadow-inner relative">
                  <Star className="w-8 h-8 text-white fill-current" />
                  {availableStars >= 5 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">Quay!</span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-amber-100 uppercase tracking-wider">Sao thưởng</p>
                  <p className="text-3xl font-black drop-shadow-sm">{availableStars} 🌟</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-3xl p-4 flex items-center gap-4 border-2 border-white/30 hover:bg-white/30 transition-colors cursor-pointer">
                <div className="bg-emerald-400 p-3 rounded-2xl shadow-inner"><Trophy className="w-8 h-8 text-white fill-current" /></div>
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-100 uppercase tracking-wider">Huy hiệu</p>
                  <p className="text-3xl font-black drop-shadow-sm">{badges.length} 🏅</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4 animate-pulse">
          <Star className="w-80 h-80 fill-current" />
        </div>
        <div className="absolute left-0 top-0 opacity-10 transform -translate-x-1/4 -translate-y-1/4">
          <PlayCircle className="w-64 h-64 fill-current" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-3xl shadow-sm border-2 border-slate-100">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="bg-sky-100 p-2 rounded-2xl"><PlayCircle className="w-8 h-8 text-sky-500 fill-sky-200" /></div> 
                Bài tập cần làm 🎯
              </h3>
              <span className="bg-rose-500 text-white px-4 py-2 rounded-2xl text-lg font-bold shadow-sm border-2 border-rose-600 animate-bounce">{pendingAssignments.length} bài</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {pendingAssignments.map(a => (
                <Link to={`/assignment/${a.id}`} key={a.id} className="group bg-white p-6 rounded-[2rem] shadow-sm border-4 border-slate-100 hover:border-sky-400 hover:shadow-xl transition-all hover:-translate-y-2 block relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-100 to-transparent rounded-bl-[3rem] -z-10 group-hover:scale-110 transition-transform"></div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-4 rounded-2xl shadow-inner ${a.type === 'essay' ? 'bg-amber-100 text-amber-600' : a.type === 'video' ? 'bg-rose-100 text-rose-600' : a.type === 'drawing' ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>
                      {a.type === 'essay' && <FileText className="w-8 h-8" />}
                      {a.type === 'video' && <Video className="w-8 h-8" />}
                      {a.type === 'drawing' && <PenTool className="w-8 h-8" />}
                      {a.type === 'quiz' && <CheckCircle className="w-8 h-8" />}
                    </div>
                    <span className="flex items-center gap-1 text-sm font-bold text-rose-600 bg-rose-100 px-3 py-1.5 rounded-xl border-2 border-rose-200">
                      <Clock className="w-4 h-4" /> {a.dueDate}
                    </span>
                  </div>
                  <h4 className="font-black text-xl text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">{a.title}</h4>
                  <p className="text-base font-medium text-slate-500 line-clamp-2">
                    {a.description || (a.type === 'essay' ? 'Viết một đoạn văn ngắn' : a.type === 'video' ? 'Xem video và trả lời câu hỏi' : a.type === 'drawing' ? 'Vẽ tranh sáng tạo' : 'Trả lời câu hỏi trắc nghiệm')}
                  </p>
                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center gap-1 text-sky-500 font-bold bg-sky-50 px-3 py-1 rounded-xl group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      Làm bài ngay <ArrowLeft className="w-4 h-4 rotate-180" />
                    </span>
                  </div>
                </Link>
              ))}
              {pendingAssignments.length === 0 && (
                <div className="col-span-2 text-center py-16 bg-white rounded-[2rem] border-4 border-slate-200 border-dashed">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-2xl font-black text-slate-400">Tuyệt vời! Bé đã làm hết bài tập rồi.</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-6 bg-white p-4 rounded-3xl shadow-sm border-2 border-slate-100">
              <div className="bg-emerald-100 p-2 rounded-2xl"><CheckCircle className="w-8 h-8 text-emerald-500 fill-emerald-200" /></div> 
              Bài đã hoàn thành 🏆
            </h3>
            <div className="space-y-4">
              {completedAssignments.map(a => {
                const sub = submissions.find(s => s.assignmentId === a.id);
                return (
                  <div key={a.id} className="bg-white p-5 rounded-[2rem] shadow-sm border-4 border-slate-100 flex items-center justify-between hover:border-emerald-200 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 shadow-inner">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg text-slate-800">{a.title}</h4>
                        <p className="text-sm font-medium text-slate-500">Đã nộp: {sub?.submittedAt}</p>
                      </div>
                    </div>
                    {sub?.status === "graded" ? (
                      <div className="text-right flex flex-col items-end gap-1">
                        {sub.level && (
                          <span className={`inline-block px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-wider border-2 ${sub.level === 'Hoàn thành tốt' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : sub.level === 'Hoàn thành' ? 'bg-sky-100 text-sky-700 border-sky-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                            {sub.level}
                          </span>
                        )}
                        {sub.score !== undefined && <p className="text-2xl font-black text-slate-800 bg-slate-50 px-3 py-1 rounded-xl border-2 border-slate-200">{sub.score} <span className="text-sm text-slate-500">điểm</span></p>}
                      </div>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-black border-2 border-amber-200 flex items-center gap-2">
                        <Clock className="w-4 h-4 animate-spin-slow" /> Đang chờ chấm
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-4 border-slate-100 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-32 h-32 bg-sky-50 rounded-br-full -z-10"></div>
            <div className="bg-amber-100 w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-4 shadow-inner transform rotate-12">
              <Gift className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Vòng quay may mắn</h3>
            <p className="text-slate-500 font-medium mb-6">Tích đủ 5 sao để quay và nhận quà nhé!</p>
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 border-2 border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-600">Sao hiện có:</span>
                <span className="font-black text-xl text-amber-500">{availableStars} 🌟</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${Math.min((availableStars / 5) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">{availableStars >= 5 ? 'Đã đủ sao để quay!' : `Cần thêm ${5 - availableStars} sao nữa`}</p>
            </div>
            <button 
              onClick={() => setShowWheel(true)}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border-4 border-white"
            >
              Mở vòng quay
            </button>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-4 border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10"></div>
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-2xl"><Trophy className="w-8 h-8 text-amber-500 fill-amber-200" /></div> 
              Huy hiệu của bé 🏅
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {badges.map(b => (
                <div key={b.id} className="bg-white p-5 rounded-[2rem] text-center border-4 border-slate-100 hover:border-amber-300 hover:bg-amber-50 hover:shadow-lg transition-all cursor-pointer group">
                  <div className="text-5xl mb-3 group-hover:scale-125 group-hover:rotate-12 transition-transform drop-shadow-sm">{b.icon}</div>
                  <p className="text-sm font-black text-slate-700 leading-tight">{b.name}</p>
                </div>
              ))}
              <div className="bg-slate-50 p-5 rounded-[2rem] text-center border-4 border-slate-200 border-dashed flex flex-col items-center justify-center opacity-60">
                <div className="w-16 h-16 bg-slate-200 rounded-full mb-3 flex items-center justify-center text-slate-400 text-2xl font-black">?</div>
                <p className="text-sm font-black text-slate-500 leading-tight">Bí ẩn</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lucky Wheel Modal */}
      {showWheel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl relative border-8 border-amber-100">
            <button onClick={() => !isSpinning && setShowWheel(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Vòng quay may mắn</h2>
              <p className="text-slate-500 font-medium">Mỗi lượt quay tốn <strong className="text-amber-500">5 sao</strong></p>
            </div>

            <div className="relative w-64 h-64 mx-auto mb-8">
              {/* Pointer */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10 text-rose-500 drop-shadow-md ${isSpinning ? 'animate-bounce' : ''}`}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z" transform="rotate(180 12 12)"/></svg>
              </div>
              
              {/* Wheel */}
              <div 
                className="w-full h-full rounded-full border-8 border-amber-400 shadow-inner overflow-hidden relative transition-transform duration-[4000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {prizes.map((p, i) => {
                  const angle = (360 / prizes.length) * i;
                  return (
                    <div 
                      key={i} 
                      className="absolute top-0 left-0 w-full h-full origin-center"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <div 
                        className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 origin-bottom flex items-start justify-center pt-4 text-xs font-bold text-white ${i % 2 === 0 ? 'bg-rose-400' : 'bg-sky-400'}`}
                        style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                      >
                        <span className="transform -rotate-90 origin-center translate-y-8 w-24 text-center block">{p}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-4 border-amber-400 z-10 shadow-sm flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-400 fill-current" />
                </div>
              </div>
            </div>

            <div className="text-center h-20 flex flex-col items-center justify-center">
              {prize ? (
                <div className="animate-in zoom-in duration-300">
                  <p className="text-slate-500 font-medium mb-1">Bé nhận được:</p>
                  <p className="text-2xl font-black text-rose-500 bg-rose-50 px-6 py-2 rounded-2xl border-2 border-rose-100 inline-block">{prize} 🎉</p>
                </div>
              ) : (
                <button 
                  onClick={spinWheel}
                  disabled={availableStars < 5 || isSpinning}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-xl px-12 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg border-4 border-white"
                >
                  {isSpinning ? 'Đang quay...' : 'QUAY NGAY!'}
                </button>
              )}
            </div>
            
            {prize && !isSpinning && (
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setPrize(null)}
                  className="text-sky-500 font-bold hover:underline"
                >
                  Quay tiếp ({availableStars} sao)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
