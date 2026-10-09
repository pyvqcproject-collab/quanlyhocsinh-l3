import { useState, useEffect } from "react";
import { subscribeToAssignments, subscribeToSubmissions, subscribeToBadges, subscribeToPosts, subscribeToAttendance, subscribeToEvaluations, subscribeToAppSettings, AttendanceRecord, EvaluationRecord } from "../firebase/db";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle, Trophy, TrendingUp, AlertCircle, Image as ImageIcon, Paperclip, UserCheck, Sparkles, FileSpreadsheet, Download, Calendar, Award } from "lucide-react";
import { exportStudentToExcel } from "../utils/studentExcelExporter";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [appSettings, setAppSettings] = useState<any>({});
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"progress" | "attendance" | "posts">("progress");

  useEffect(() => {
    if (user?.studentId) {
      const unsubAssignments = subscribeToAssignments(setAssignments);
      const unsubSubmissions = subscribeToSubmissions(setSubmissions, undefined, user.studentId);
      const unsubBadges = subscribeToBadges(setBadges, user.studentId);
      const unsubPosts = subscribeToPosts(setPosts);
      const unsubAttendance = subscribeToAttendance((records) => {
        setAttendance(records.filter(r => r.studentId === user.studentId));
      });
      const unsubEvaluations = subscribeToEvaluations((records) => {
        setEvaluations(records);
      }, user.studentId);
      const unsubSettings = subscribeToAppSettings(setAppSettings);

      // Mock AI Analysis
      setAnalysis({
        improvementPercentage: 15,
        trend: "Tiến bộ rõ rệt",
        summary: `Bé đã hoàn thành rất tốt các bài tập tuần này. Cần khuyến khích bé đọc thêm sách.`
      });

      return () => {
        unsubAssignments();
        unsubSubmissions();
        unsubBadges();
        unsubPosts();
        unsubAttendance();
        unsubEvaluations();
        unsubSettings();
      };
    }
  }, [user]);

  const chartData = [
    { name: 'Tuần 1', score: 7.5 },
    { name: 'Tuần 2', score: 8.0 },
    { name: 'Tuần 3', score: 8.5 },
    { name: 'Tuần 4', score: 9.0 },
  ];

  const handleExportChildExcel = () => {
    if (!user) return;
    const studentObj = {
      id: user.studentId,
      name: user.name?.replace('Phụ huynh ', '') || user.studentId,
      gender: "",
      birthdate: ""
    };
    exportStudentToExcel({
      student: studentObj,
      attendanceList: attendance,
      assignmentsList: assignments,
      submissionsList: submissions,
      evaluationsList: evaluations,
      badgesList: badges,
      appSettings
    });
  };

  const attendanceTotal = attendance.length;
  const attendancePresent = attendance.filter(a => a.status === 'present').length;
  const attendanceExcused = attendance.filter(a => a.status === 'excused').length;
  const attendanceUnexcused = attendance.filter(a => a.status === 'unexcused').length;
  const attendanceLate = attendance.filter(a => a.status === 'late').length;
  const attendanceRate = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 pb-2 overflow-x-auto justify-between items-center">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("progress")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap cursor-pointer ${activeTab === "progress" ? "text-emerald-600 border-b-2 border-emerald-600 font-bold" : "text-slate-500 hover:text-slate-700"}`}>Kết quả học tập</button>
          <button onClick={() => setActiveTab("attendance")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === "attendance" ? "text-emerald-600 border-b-2 border-emerald-600 font-bold" : "text-slate-500 hover:text-slate-700"}`}><UserCheck className="w-4 h-4" /> Điểm danh & Nhận xét</button>
          <button onClick={() => setActiveTab("posts")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap cursor-pointer ${activeTab === "posts" ? "text-emerald-600 border-b-2 border-emerald-600 font-bold" : "text-slate-500 hover:text-slate-700"}`}>Bảng tin</button>
        </div>

        <button
          onClick={handleExportChildExcel}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-all cursor-pointer active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4" /> Xuất Excel của con
        </button>
      </div>

      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Chuyên cần & Nhận xét của {user?.name?.replace('Phụ huynh ', '')}</h2>
            <button
              onClick={handleExportChildExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-all"
            >
              <Download className="w-4 h-4" /> Tải báo cáo Excel
            </button>
          </div>

          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-xs text-slate-400 font-bold block">Tỷ lệ chuyên cần</span>
              <span className="text-2xl font-extrabold text-emerald-600">{attendanceRate}%</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-xs text-slate-400 font-bold block">Có mặt</span>
              <span className="text-2xl font-extrabold text-emerald-700">{attendancePresent} buổi</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-xs text-slate-400 font-bold block">Vắng có phép</span>
              <span className="text-2xl font-extrabold text-amber-600">{attendanceExcused}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-xs text-slate-400 font-bold block">Không phép</span>
              <span className="text-2xl font-extrabold text-rose-600">{attendanceUnexcused}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-xs text-slate-400 font-bold block">Đi muộn</span>
              <span className="text-2xl font-extrabold text-orange-600">{attendanceLate}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evaluations from Teacher */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> Nhận xét & Đánh giá định kỳ của giáo viên
              </h3>

              {evaluations.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chưa có nhận xét định kỳ nào từ giáo viên.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {evaluations.map((ev, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-sm text-slate-800">{ev.periodLabel}</span>
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                          🌟 {ev.overallRating}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                        "{ev.comment}"
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 pt-1 font-medium">
                        <span>Ý thức: <strong>{ev.academicEffort}</strong></span>
                        <span>·</span>
                        <span>Nề nếp: <strong>{ev.discipline}</strong></span>
                        <span>·</span>
                        <span>Đoàn kết: <strong>{ev.teamwork}</strong></span>
                      </div>
                      <p className="text-[10px] text-slate-400 text-right">Giáo viên: {ev.teacherName || "Cô giáo"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance Logs */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" /> Lịch sử điểm danh chi tiết
              </h3>

              {attendance.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chưa có lịch sử điểm danh.
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto rounded-2xl border border-slate-100 divide-y divide-slate-100">
                  {attendance.sort((a, b) => b.date.localeCompare(a.date)).map((att, i) => (
                    <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-800">{att.date}</span>
                        {att.note && <span className="text-slate-400 ml-2 italic">({att.note})</span>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl font-bold text-[10px] ${
                        att.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                        att.status === 'excused' ? 'bg-amber-100 text-amber-800' :
                        att.status === 'late' ? 'bg-orange-100 text-orange-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {att.status === 'present' ? 'Có mặt' : att.status === 'excused' ? 'Có phép' : att.status === 'late' ? 'Đi muộn' : 'Vắng không phép'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "progress" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Tình hình học tập của {user?.name?.replace('Phụ huynh ', '')}</h2>
          
          {analysis && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-sm flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-xl"><TrendingUp className="w-8 h-8" /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">Phân tích từ AI Giáo viên</h3>
                <p className="text-emerald-50 mb-2">{analysis.summary}</p>
                <div className="flex gap-3 mt-4">
                  <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium">Xu hướng: {analysis.trend}</span>
                  <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium">Cải thiện: +{analysis.improvementPercentage}%</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Biểu đồ tiến bộ</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} domain={[0, 10]} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Lịch sử làm bài</h3>
                <div className="space-y-4">
                  {submissions.map(sub => {
                    const a = assignments.find(x => x.id === sub.assignmentId);
                    return (
                      <div key={sub.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-bold text-slate-800">{a?.title}</h4>
                            <p className="text-sm text-slate-500">Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {sub.status === "graded" ? (
                            <>
                              {sub.level && <p className={`text-sm font-bold ${sub.level === 'Hoàn thành tốt' ? 'text-emerald-600' : sub.level === 'Hoàn thành' ? 'text-sky-600' : 'text-rose-600'}`}>{sub.level}</p>}
                              {a?.gradingType === 'score' && sub.score !== undefined && <p className="text-sm font-bold text-slate-800">{sub.score} điểm</p>}
                              {sub.comment && <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate">{sub.comment}</p>}
                            </>
                          ) : (
                            <p className="text-sm font-bold text-amber-600">Đang chờ chấm</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" /> Huy hiệu đạt được
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {badges.map(b => (
                    <div key={b.id} className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
                      <div className="text-3xl mb-1">{b.icon}</div>
                      <p className="text-xs font-bold text-amber-700">{b.name}</p>
                    </div>
                  ))}
                  {badges.length === 0 && (
                    <div className="col-span-2 text-center py-4">
                      <p className="text-sm text-slate-500">Chưa có huy hiệu nào.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "posts" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Bảng tin lớp học</h2>
          <div className="space-y-6">
            {posts.map(post => (
                  <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold text-lg">GV</div>
                        <div>
                          <h4 className="font-bold text-slate-800">Cô giáo</h4>
                          <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap mb-4">{post.content}</p>
                
                {post.files && post.files.length > 0 && (
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {post.files.map((file: any, idx: number) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                        {file.type.startsWith('image/') ? (
                          <img src={file.data} alt={file.name} className="w-full h-auto max-h-[300px] object-cover" />
                        ) : (
                          <a href={file.data} download={file.name} className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="p-2 bg-sky-100 text-sky-600 rounded-lg"><Paperclip className="w-5 h-5" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">Nhấn để tải xuống</p>
                            </div>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {post.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-slate-100">
                    <img src={post.imageUrl} alt="Post image" className="w-full h-auto max-h-[400px] object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                {post.videoUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-100 aspect-video bg-black">
                    <iframe 
                      src={`https://www.youtube.com/embed/${post.videoUrl.split('v=')[1]?.split('&')[0] || post.videoUrl.split('/').pop()}`} 
                      className="w-full h-full" 
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>
            ))}
            {posts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Chưa có bài đăng nào trên bảng tin.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
