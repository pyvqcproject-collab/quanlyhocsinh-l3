import { useState, useEffect } from "react";
import { 
  subscribeToAssignments, 
  subscribeToSubmissions, 
  subscribeToBadges, 
  updateStudent, 
  addBadge, 
  updateSubmission, 
  subscribeToAppSettings, 
  createNotification, 
  subscribeToAttendance,
  subscribeToEvaluations,
  AttendanceRecord,
  EvaluationRecord,
  DEFAULT_WHEEL_PRIZES 
} from "../firebase/db";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { 
  PlayCircle, 
  CheckCircle, 
  Star, 
  Trophy, 
  Clock, 
  FileText, 
  PenTool, 
  Video, 
  ArrowLeft, 
  Gift, 
  X, 
  Sparkles,
  UserCheck,
  FileSpreadsheet,
  Calendar,
  Award,
  Download
} from "lucide-react";
import confetti from "canvas-confetti";
import LuckyWheel from "./LuckyWheel";
import { exportStudentToExcel } from "../utils/studentExcelExporter";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [appSettings, setAppSettings] = useState<any>({});
  const [localSpinsUsed, setLocalSpinsUsed] = useState(0);
  
  const [showWheel, setShowWheel] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const prizes: string[] = (appSettings?.wheelPrizes && Array.isArray(appSettings.wheelPrizes) && appSettings.wheelPrizes.length >= 2)
    ? appSettings.wheelPrizes
    : DEFAULT_WHEEL_PRIZES;

  const spinCost = Number(appSettings?.spinCost) > 0 ? Number(appSettings.spinCost) : 5;

  useEffect(() => {
    const unsubSettings = subscribeToAppSettings(setAppSettings);
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setLocalSpinsUsed(user.spinsUsed || 0);
      
      const unsubAssignments = subscribeToAssignments(setAssignments);
      const unsubSubmissions = subscribeToSubmissions(setSubmissions, undefined, user.id);
      const unsubBadges = subscribeToBadges(setBadges, user.id);
      const unsubAttendance = subscribeToAttendance((records) => {
        setAttendance(records.filter(r => r.studentId === user.id));
      });
      const unsubEvaluations = subscribeToEvaluations((records) => {
        setEvaluations(records);
      }, user.id);
      
      return () => {
        unsubAssignments();
        unsubSubmissions();
        unsubBadges();
        unsubAttendance();
        unsubEvaluations();
      };
    }
  }, [user]);

  const handleExportMyExcel = () => {
    if (!user) return;
    exportStudentToExcel({
      student: user,
      attendanceList: attendance,
      assignmentsList: assignments,
      submissionsList: submissions,
      evaluationsList: evaluations,
      badgesList: badges,
      appSettings
    });
  };

  const pendingAssignments = assignments.filter(a => {
    const sub = submissions.find(s => s.assignmentId === a.id);
    return !sub || sub.status === "redo_approved";
  });
  const completedAssignments = assignments.filter(a => {
    const sub = submissions.find(s => s.assignmentId === a.id);
    return sub && sub.status !== "redo_approved";
  });

  const totalStars = submissions.reduce((acc, sub) => acc + (sub.stars || 0), 0);
  const availableStars = Math.max(0, totalStars - (localSpinsUsed * spinCost));

  const handleRequestRedo = async (submissionId: string) => {
    if (window.confirm("Em có chắc chắn muốn xin làm lại bài này không?")) {
      await updateSubmission(submissionId, { status: "redo_requested" });
    }
  };

  const spinWheel = async () => {
    if (availableStars < spinCost || isSpinning || prizes.length < 2) return;
    
    setIsSpinning(true);
    setPrize(null);
    
    const newSpinsUsed = localSpinsUsed + 1;
    setLocalSpinsUsed(newSpinsUsed);
    await updateStudent(user.id, { spinsUsed: newSpinsUsed });
    
    // Random target prize
    const targetIndex = Math.floor(Math.random() * prizes.length);
    const wonPrize = prizes[targetIndex];
    
    const sliceAngle = 360 / prizes.length;
    const sliceCenter = targetIndex * sliceAngle + sliceAngle / 2;
    // To align sliceCenter at 12 o'clock (0 degrees):
    const stopAngle = (360 - sliceCenter) % 360;
    const currentAngle = ((rotation % 360) + 360) % 360;
    const delta = ((stopAngle - currentAngle) % 360 + 360) % 360;
    const extraTurns = 5;
    const newRotation = rotation + (extraTurns * 360) + delta;
    setRotation(newRotation);
    
    setTimeout(async () => {
      setIsSpinning(false);
      setPrize(wonPrize);
      
      if (wonPrize !== "Chúc may mắn lần sau") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#ec4899']
        });
      }
      
      if (wonPrize === "Thêm 1 lượt quay") {
        setLocalSpinsUsed(prev => Math.max(0, prev - 1));
        await updateStudent(user.id, { spinsUsed: Math.max(0, newSpinsUsed - 1) });
      } else if (wonPrize.includes("Huy hiệu")) {
        await addBadge({ studentId: user.id, name: wonPrize, icon: "🌟" });
      }

      // Gửi thông báo đến giáo viên ngay lập tức
      try {
        await createNotification({
          type: "wheel_prize",
          studentId: user.id,
          studentName: user.name || user.email || "Học sinh",
          studentAvatar: user.avatarUrl || "",
          prize: wonPrize,
          title: "Quay thưởng may mắn",
          message: `Học sinh ${user.name || "Bé"} vừa quay vòng quay may mắn và nhận được: "${wonPrize}"`
        });
      } catch (err) {
        console.error("Lỗi gửi thông báo cho giáo viên:", err);
      }
    }, 4000);
  };

  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "attendance">("pending");

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Android Hero Card */}
      <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-500/15 relative overflow-hidden">
        {/* Subtle geometric circles (Android Material theme) */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white/90 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-white font-extrabold text-4xl shadow-lg border-4 border-white/90">
                {user?.name ? user.name.charAt(0) : "HS"}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 p-1.5 rounded-full shadow-md">
              <Sparkles className="w-4 h-4 fill-amber-950" />
            </div>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold text-white mb-2">
              <span>🎒</span> Lớp học thông minh
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Chào bé {user?.name || "Học sinh"}! 👋
            </h2>
            <p className="text-sky-100 text-sm sm:text-base font-medium mb-5 max-w-xl">
              Hôm nay chúng mình cùng khám phá những bài học thú vị và tích thật nhiều sao thưởng nhé! 🚀
            </p>

            {/* Quick Stat Action Chips */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              <button
                type="button"
                onClick={() => setShowWheel(true)}
                className="group flex items-center gap-3 bg-white/15 hover:bg-white/25 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/25 transition-all active:scale-95 cursor-pointer shadow-sm text-left"
              >
                <div className="w-11 h-11 bg-amber-400 rounded-xl flex items-center justify-center text-amber-950 shadow-inner relative">
                  <Star className="w-6 h-6 fill-current text-amber-950" />
                  {availableStars >= spinCost && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                      Quay!
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-sky-100 uppercase tracking-wider block">
                    Sao tích lũy
                  </span>
                  <span className="text-xl font-black text-white">{availableStars} 🌟</span>
                </div>
              </button>

              <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/25 shadow-sm text-left">
                <div className="w-11 h-11 bg-emerald-400 rounded-xl flex items-center justify-center text-emerald-950 shadow-inner">
                  <Trophy className="w-6 h-6 fill-current text-emerald-950" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-sky-100 uppercase tracking-wider block">
                    Huy hiệu đạt được
                  </span>
                  <span className="text-xl font-black text-white">{badges.length} 🏅</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Responsive 2-column on desktop, smooth stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Tasks Section */}
        <div className="lg:col-span-8 space-y-6">
          {/* Android Segmented Control for Tasks */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "pending"
                  ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <PlayCircle className="w-5 h-5" />
              <span>Bài cần làm</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                  activeTab === "pending" ? "bg-white/25 text-white" : "bg-rose-100 text-rose-600"
                }`}
              >
                {pendingAssignments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "completed"
                  ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Bài đã nộp</span>
              <span
                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-extrabold ${
                  activeTab === "completed" ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {completedAssignments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "attendance"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Chuyên cần & Nhận xét</span>
            </button>
          </div>

          {/* Pending Tasks View */}
          {activeTab === "pending" && (
            <div className="space-y-4">
              {pendingAssignments.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner">
                    🎉
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Hoan hô bé!</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Bé đã hoàn thành hết các bài tập cần làm rồi. Hãy quay vòng quay may mắn hoặc ôn lại bài nhé!
                  </p>
                  <button
                    onClick={() => setShowWheel(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md text-sm cursor-pointer active:scale-95 transition-all mt-2"
                  >
                    <span>🎡</span> Quay thưởng ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pendingAssignments.map((a) => (
                    <Link
                      to={`/assignment/${a.id}`}
                      key={a.id}
                      className="group bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10 transition-all flex flex-col justify-between active:scale-[0.99] relative overflow-hidden"
                    >
                      <div>
                        {/* Top card metadata */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                              a.type === "essay"
                                ? "bg-amber-100 text-amber-600"
                                : a.type === "video"
                                ? "bg-rose-100 text-rose-600"
                                : "bg-sky-100 text-sky-600"
                            }`}
                          >
                            {a.type === "essay" && <FileText className="w-6 h-6" />}
                            {a.type === "video" && <Video className="w-6 h-6" />}
                            {a.type === "quiz" && <CheckCircle className="w-6 h-6" />}
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {a.dueDate || "Hôm nay"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                              {a.type === "essay" ? "Tự luận" : a.type === "video" ? "Video tương tác" : "Trắc nghiệm"}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className="font-extrabold text-base sm:text-lg text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-2 mb-1.5">
                          {a.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 font-medium mb-4">
                          {a.description || "Bấm vào để mở và làm bài tập ngay nhé bé!"}
                        </p>
                      </div>

                      {/* Action CTA */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-600">Bài tập mới</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-sky-500 group-hover:bg-sky-600 px-4 py-2 rounded-xl shadow-xs transition-colors">
                          Làm bài ngay <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completed Tasks View */}
          {activeTab === "completed" && (
            <div className="space-y-3">
              {completedAssignments.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-2">
                  <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center text-2xl mx-auto">
                    📝
                  </div>
                  <h3 className="text-base font-bold text-slate-700">Chưa có bài nào đã nộp</h3>
                  <p className="text-xs text-slate-400">Các bài tập sau khi hoàn thành sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                completedAssignments.map((a) => {
                  const sub = submissions.find((s) => s.assignmentId === a.id);
                  return (
                    <div
                      key={a.id}
                      className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 text-sm sm:text-base truncate">
                            {a.title}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium">
                            {sub?.submittedAt ? `Nộp: ${new Date(sub.submittedAt).toLocaleDateString('vi-VN')}` : "Đã hoàn thành"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {sub?.status === "graded" ? (
                          <div className="flex items-center gap-2">
                            {sub.level && (
                              <span
                                className={`text-xs font-extrabold px-3 py-1 rounded-xl ${
                                  sub.level === "Hoàn thành tốt"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : sub.level === "Hoàn thành"
                                    ? "bg-sky-100 text-sky-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {sub.level}
                              </span>
                            )}
                            {a.gradingType === "score" && sub.score !== undefined && (
                              <span className="text-xs font-black bg-slate-100 text-slate-800 px-3 py-1 rounded-xl">
                                {sub.score} điểm
                              </span>
                            )}
                            {sub.stars ? (
                              <span className="text-xs font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-xl flex items-center gap-1">
                                {sub.stars} 🌟
                              </span>
                            ) : null}
                          </div>
                        ) : sub?.status === "redo_requested" ? (
                          <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-xl flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Chờ cô duyệt
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-xl flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Chờ chấm
                          </span>
                        )}

                        {sub?.status !== "redo_requested" && (
                          <button
                            onClick={() => handleRequestRedo(sub!.id)}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer active:scale-95"
                          >
                            Xin làm lại
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Attendance & Evaluations View */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              {/* Summary Attendance Card */}
              {(() => {
                const totalAtt = attendance.length;
                const presentCount = attendance.filter(a => a.status === 'present').length;
                const excusedCount = attendance.filter(a => a.status === 'excused').length;
                const lateCount = attendance.filter(a => a.status === 'late').length;
                const unexcusedCount = attendance.filter(a => a.status === 'unexcused').length;
                const rate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;

                return (
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-emerald-600" /> Tình hình Chuyên cần của bé
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Đi học chăm ngoan, đúng giờ và hoàn thành tốt nhiệm vụ mỗi ngày.
                        </p>
                      </div>

                      <button
                        onClick={handleExportMyExcel}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs border border-emerald-200 transition-all cursor-pointer active:scale-95 shadow-xs"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất file Excel của em
                      </button>
                    </div>

                    {/* Stats chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 text-center">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Chuyên cần</span>
                        <span className="text-2xl font-black text-emerald-800">{rate}%</span>
                        <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">{presentCount}/{totalAtt} buổi</span>
                      </div>

                      <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 text-center">
                        <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">Có mặt</span>
                        <span className="text-2xl font-black text-sky-800">{presentCount}</span>
                        <span className="text-[10px] text-sky-600 font-semibold block mt-0.5">buổi học</span>
                      </div>

                      <div className="bg-orange-50/80 p-3 rounded-2xl border border-orange-200 text-center">
                        <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">Đi muộn</span>
                        <span className="text-2xl font-black text-orange-800">{lateCount}</span>
                        <span className="text-[10px] text-orange-600 font-semibold block mt-0.5">lần</span>
                      </div>

                      <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 text-center">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Nghỉ phép</span>
                        <span className="text-2xl font-black text-amber-800">{excusedCount}</span>
                        <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">buổi</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Evaluations from Teacher */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> Nhận xét & Đánh giá của cô giáo 🌟
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">
                    {evaluations.length} lượt nhận xét
                  </span>
                </div>

                {evaluations.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <span className="text-3xl">🌸</span>
                    <p className="text-xs sm:text-sm font-bold text-slate-600">Chưa có đánh giá định kỳ nào từ cô giáo.</p>
                    <p className="text-[11px] text-slate-400">Cô sẽ đánh giá vào cuối mỗi ngày, cuối tuần hoặc cuối tháng nhé!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evaluations.map((ev, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-xs sm:text-sm text-indigo-950 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-600" /> {ev.periodLabel}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl shadow-xs ${
                            ev.overallRating === 'Tốt' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            ev.overallRating === 'Đạt' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                            'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            🌟 {ev.overallRating}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 font-semibold bg-white/70 p-3 rounded-xl border border-indigo-100/60 leading-relaxed">
                          "{ev.comment || "Bé học tập chăm ngoan và có nhiều tiến bộ!"}"
                        </p>

                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold pt-1">
                          <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200/60">
                            Ý thức: {ev.academicEffort}
                          </span>
                          <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200/60">
                            Kỷ luật: {ev.discipline}
                          </span>
                          <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200/60">
                            Đoàn kết: {ev.teamwork}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attendance Day Log */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" /> Nhật ký Điểm danh hàng ngày
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">
                    {attendance.length} ngày ghi nhận
                  </span>
                </div>

                {attendance.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">Chưa có dữ liệu điểm danh.</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {[...attendance]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((att, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between text-xs transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <div>
                              <span className="font-extrabold text-slate-800">{att.date}</span>
                              {att.note && (
                                <p className="text-[11px] text-slate-400 mt-0.5">Ghi chú: {att.note}</p>
                              )}
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold shrink-0 ${
                            att.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                            att.status === 'excused' ? 'bg-amber-100 text-amber-800' :
                            att.status === 'late' ? 'bg-orange-100 text-orange-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {att.status === 'present' ? '✅ Có mặt' :
                             att.status === 'excused' ? '📝 Có phép' :
                             att.status === 'late' ? '⏰ Đi muộn' :
                             '❌ Không phép'}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Android Side Cards (Wheel & Badges) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Lucky Wheel Widget Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mb-3 shadow-inner">
              🎡
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">Vòng quay may mắn</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Tích đủ <strong className="text-amber-600">{spinCost} sao</strong> để quay và nhận quà từ cô nhé!
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-600">Sao hiện có:</span>
                <span className="text-base font-extrabold text-amber-500">{availableStars} 🌟</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min((availableStars / spinCost) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-semibold">
                {availableStars >= spinCost
                  ? "🎉 Bé đã đủ sao để quay thưởng ngay!"
                  : `Cần thêm ${Math.max(0, spinCost - availableStars)} sao nữa`}
              </p>
            </div>

            <button
              onClick={() => setShowWheel(true)}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-extrabold text-base py-3.5 rounded-2xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Mở vòng quay 🎲
            </button>
          </div>

          {/* Badges Widget Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Huy hiệu của bé
              </h3>
              <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                {badges.length} huy hiệu
              </span>
            </div>

            {badges.length === 0 ? (
              <div className="text-center py-6 text-slate-400 space-y-1">
                <div className="text-3xl mb-1">🏅</div>
                <p className="text-xs font-semibold">Bé chưa có huy hiệu nào</p>
                <p className="text-[11px]">Hãy làm bài thật tốt và quay thưởng để sưu tầm nhé!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className="bg-slate-50 hover:bg-amber-50/60 p-3.5 rounded-2xl text-center border border-slate-100 hover:border-amber-200 transition-all cursor-pointer group"
                  >
                    <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                      {b.icon || "🌟"}
                    </div>
                    <p className="text-xs font-extrabold text-slate-700 truncate">{b.name}</p>
                  </div>
                ))}
              </div>
            )}
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
            
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Vòng quay may mắn</h2>
              <p className="text-slate-500 font-medium">Mỗi lượt quay tốn <strong className="text-amber-500">{spinCost} sao</strong> (Hiện có: <strong>{availableStars} sao</strong>)</p>
            </div>

            <div className="mb-6 flex justify-center">
              <LuckyWheel prizes={prizes} rotation={rotation} isSpinning={isSpinning} size={280} />
            </div>

            <div className="text-center min-h-[5rem] flex flex-col items-center justify-center">
              {prize ? (
                <div className="animate-in zoom-in duration-300">
                  <p className="text-slate-500 font-medium mb-1">Bé nhận được:</p>
                  <p className="text-2xl font-black text-rose-500 bg-rose-50 px-6 py-2 rounded-2xl border-2 border-rose-100 inline-block">{prize} 🎉</p>
                </div>
              ) : (
                <button 
                  onClick={spinWheel}
                  disabled={availableStars < spinCost || isSpinning}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-xl px-12 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg border-4 border-white cursor-pointer disabled:cursor-not-allowed"
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
