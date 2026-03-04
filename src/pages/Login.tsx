import React, { useState } from "react";
import { login } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, User, Users, Lock, Mail, Sparkles } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const loginEmail = email.includes("@") ? email : `${email}@school.com`;
    
    try {
      console.log("Attempting login for:", loginEmail, "with role:", role);
      const u = await login(loginEmail, password, role);
      console.log("Login successful, user:", u.email);
      // setUser(u); // AuthContext handles it via onAuthStateChanged
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      setError("Tên đăng nhập hoặc mật khẩu không đúng!");
    }
  };

  const setDemoUser = (r: string) => {
    setRole(r);
    if (r === "teacher") {
      setEmail("teacher");
      setPassword("123456");
    } else if (r === "student") {
      setEmail("student");
      setPassword("123456");
    } else {
      setEmail("PHHS01");
      setPassword("123456");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl overflow-hidden border-4 border-white">
        <div className="bg-slate-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
              <Sparkles className="w-8 h-8 text-sky-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Chào mừng bé!</h2>
            <p className="text-slate-400 font-medium">Đăng nhập để bắt đầu học nhé</p>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex justify-center gap-4 mb-8">
            <button onClick={() => setDemoUser("student")} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all w-24 ${role === "student" ? "border-sky-500 bg-sky-50 text-sky-600 ring-2 ring-sky-200" : "border-gray-100 text-gray-400 hover:border-sky-200"}`}>
              <User className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold uppercase">Học sinh</span>
            </button>
            <button onClick={() => setDemoUser("teacher")} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all w-24 ${role === "teacher" ? "border-amber-500 bg-amber-50 text-amber-600 ring-2 ring-amber-200" : "border-gray-100 text-gray-400 hover:border-amber-200"}`}>
              <GraduationCap className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold uppercase">Giáo viên</span>
            </button>
            <button onClick={() => setDemoUser("parent")} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all w-24 ${role === "parent" ? "border-emerald-500 bg-emerald-50 text-emerald-600 ring-2 ring-emerald-200" : "border-gray-100 text-gray-400 hover:border-emerald-200"}`}>
              <Users className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold uppercase">Phụ huynh</span>
            </button>
          </div>

          <div className="mb-6 text-center">
            <p className="text-sm font-medium text-gray-500">
              Bạn đang đăng nhập với tư cách: <span className={`font-bold ${role === 'teacher' ? 'text-amber-600' : role === 'student' ? 'text-sky-600' : 'text-emerald-600'}`}>
                {role === 'teacher' ? 'Giáo viên' : role === 'student' ? 'Học sinh' : 'Phụ huynh'}
              </span>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100 flex items-center gap-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">Tên đăng nhập</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-100 outline-none focus:border-sky-500 transition-colors font-medium"
                  placeholder="Ví dụ: teacher"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-100 outline-none focus:border-sky-500 transition-colors font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-slate-700 transition-all active:scale-95 mt-4"
            >
              Đăng nhập ngay 🚀
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
