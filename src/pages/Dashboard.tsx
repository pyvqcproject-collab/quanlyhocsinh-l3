import { useAuth } from "../context/AuthContext";
import TeacherDashboard from "../components/TeacherDashboard";
import StudentDashboard from "../components/StudentDashboard";
import ParentDashboard from "../components/ParentDashboard";
import { LogOut } from "lucide-react";
import { logout } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAppSettings } from "../firebase/db";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appSettings, setAppSettings] = useState<any>({});

  useEffect(() => {
    getAppSettings().then(setAppSettings);
    const handleSettingsChange = () => getAppSettings().then(setAppSettings);
    window.addEventListener('appSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('appSettingsChanged', handleSettingsChange);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {appSettings.avatarUrl ? (
              <img src={appSettings.avatarUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                LH
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-800">{appSettings.appName || "Lớp Học Đảo Ngược"}</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 font-medium">
                  Xin chào, {user?.role === "teacher" ? (appSettings.teacherName || user?.name || user?.email) : (user?.name || user?.email)}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                  user?.role === 'teacher' ? 'bg-amber-100 text-amber-600' : 
                  user?.role === 'student' ? 'bg-sky-100 text-sky-600' : 
                  'bg-slate-100 text-slate-600'
                }`}>
                  {user?.role || 'Chưa xác định'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200" />
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user?.role === "teacher" && <TeacherDashboard />}
        {user?.role === "student" && <StudentDashboard />}
        {user?.role === "parent" && <ParentDashboard />}
        {!user?.role && (
          <div className="text-center py-20">
            <p className="text-slate-500">Đang xác định quyền hạn của bạn...</p>
            <p className="text-xs text-slate-400 mt-2">Email: {user?.email}</p>
          </div>
        )}
      </main>
    </div>
  );
}
