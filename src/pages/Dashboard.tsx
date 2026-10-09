import { useAuth } from "../context/AuthContext";
import TeacherDashboard from "../components/TeacherDashboard";
import StudentDashboard from "../components/StudentDashboard";
import ParentDashboard from "../components/ParentDashboard";
import NotificationBell from "../components/NotificationBell";
import { LogOut } from "lucide-react";
import { logout } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { subscribeToAppSettings } from "../firebase/db";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appSettings, setAppSettings] = useState<any>({});

  useEffect(() => {
    const unsub = subscribeToAppSettings(setAppSettings);
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Android Top App Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 transition-shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {appSettings.avatarUrl ? (
              <img src={appSettings.avatarUrl} alt="Logo" className="w-10 h-10 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-100" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0 shadow-sky-500/20">
                LH
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-800 truncate tracking-tight">
                {appSettings.appName || "Lớp Học Đảo Ngược"}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 font-semibold truncate">
                  {user?.role === "teacher" ? (appSettings.teacherName || user?.name || user?.email) : (user?.name || user?.email)}
                </p>
                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  user?.role === 'teacher' ? 'bg-amber-100 text-amber-800' : 
                  user?.role === 'student' ? 'bg-sky-100 text-sky-800' : 
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {user?.role === 'teacher' ? 'Giáo viên' : user?.role === 'student' ? 'Học sinh' : user?.role === 'parent' ? 'Phụ huynh' : 'Thành viên'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-2">
            {user?.role === "teacher" && <NotificationBell />}
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover shadow-sm border-2 border-white ring-1 ring-slate-200" />
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-600 hover:text-rose-600 transition-colors px-2.5 sm:px-3 py-2 rounded-xl hover:bg-rose-50 text-xs sm:text-sm font-bold active:scale-95"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {user?.role === "teacher" && <TeacherDashboard />}
        {user?.role === "student" && <StudentDashboard />}
        {user?.role === "parent" && <ParentDashboard />}
        {!user?.role && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 max-w-lg mx-auto mt-10">
            <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Chưa xác định được quyền hạn</h2>
            <p className="text-slate-500 mb-2">Hệ thống không tìm thấy vai trò (Giáo viên/Học sinh) cho tài khoản của bạn.</p>
            <p className="text-sm font-medium text-slate-400 mb-8">Email: {user?.email}</p>
            
            <button onClick={handleLogout} className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all">
              Đăng xuất và Đăng nhập lại
            </button>
            <p className="text-xs text-slate-400 mt-6 px-6">
              Mẹo: Ở màn hình đăng nhập, hãy nhớ <b>chọn đúng vai trò</b> (Giáo viên hoặc Học sinh) trước khi bấm Đăng nhập. Hệ thống sẽ tự động sửa lỗi và cấp quyền cho bạn.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
