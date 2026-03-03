import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { logout } from "../firebase/auth";
import { getAppSettings } from "../firebase/db";
import { useNavigate } from "react-router-dom";
import TeacherDashboard from "../components/TeacherDashboard";
import StudentDashboard from "../components/StudentDashboard";
import ParentDashboard from "../components/ParentDashboard";
import { LogOut, Layout } from "lucide-react";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [appSettings, setAppSettings] = useState<any>({});

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getAppSettings();
      setAppSettings(settings);
    };
    loadSettings();
    
    const handleSettingsChange = () => loadSettings();
    window.addEventListener('appSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('appSettingsChanged', handleSettingsChange);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/login");
  };

  if (!user) return null;

  // Tự động xác định vai trò nếu bị thiếu (Sửa lỗi trang trắng)
  const userRole = user.role || (user.email?.includes('teacher') ? 'teacher' : 'student');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 p-2 rounded-xl">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{appSettings.appName || "Lớp Học Đảo Ngược"}</h1>
              <p className="text-xs text-slate-500 font-medium">Xin chào, {user.name || user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-medium transition-colors px-4 py-2 rounded-xl hover:bg-rose-50">
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userRole === 'teacher' && <TeacherDashboard />}
        {userRole === 'student' && <StudentDashboard />}
        {userRole === 'parent' && <ParentDashboard />}
      </main>
    </div>
  );
}
