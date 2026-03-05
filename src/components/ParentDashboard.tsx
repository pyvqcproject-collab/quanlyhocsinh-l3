import { useState, useEffect } from "react";
import { getAssignments, getSubmissions, getBadges, getPosts } from "../firebase/db";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle, Trophy, TrendingUp, AlertCircle, Image as ImageIcon, Paperclip, Volume2 } from "lucide-react";
import { TTSButton } from "./TTSButton";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("progress");

  useEffect(() => {
    if (user?.studentId) {
      loadData(user.studentId);
    }
  }, [user]);

  const loadData = async (studentId: string) => {
    const as = await getAssignments();
    const su = await getSubmissions(undefined, studentId);
    const ba = await getBadges(studentId);
    const po = await getPosts();
    setAssignments(as);
    setSubmissions(su);
    setBadges(ba);
    setPosts(po);

    // Mock AI Analysis
    setAnalysis({
      improvementPercentage: 15,
      trend: "Tiến bộ rõ rệt",
      summary: `Bé đã hoàn thành rất tốt các bài tập tuần này. Cần khuyến khích bé đọc thêm sách.`
    });
  };

  const chartData = [
    { name: 'Tuần 1', score: 7.5 },
    { name: 'Tuần 2', score: 8.0 },
    { name: 'Tuần 3', score: 8.5 },
    { name: 'Tuần 4', score: 9.0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 pb-2 overflow-x-auto">
        <button onClick={() => setActiveTab("progress")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap ${activeTab === "progress" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Kết quả học tập</button>
        <button onClick={() => setActiveTab("posts")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap ${activeTab === "posts" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Bảng tin</button>
      </div>

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
                          <TTSButton text={`${a?.title || ""}. ${a?.description || ""}`} className="bg-white shadow-sm" />
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
                      <TTSButton text={post.content} className="bg-slate-50" />
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
