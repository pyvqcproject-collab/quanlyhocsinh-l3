import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login, register } from "../firebase/auth";
import { addTeacher, getUser } from "../firebase/db";
import { useNavigate } from "react-router-dom";
import { BookOpen, User, Users, GraduationCap } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Tự động chuyển về chữ thường và thêm đuôi @school.com nếu thiếu
    const rawEmail = email.includes("@") ? email : `${email}@school.com`;
    const loginEmail = rawEmail.toLowerCase().trim();
    
    try {
      const u = await login(loginEmail, password, role);
      setUser(u);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      
      // Kiểm tra xem người dùng có tồn tại trong Cơ sở dữ liệu không
      const firestoreUser = await getUser(loginEmail);
      
      if (firestoreUser) {
        // Trường hợp 1: Có trong DB nhưng đăng nhập thất bại (có thể do sai mật khẩu Auth)
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
          if (firestoreUser.password === password) {
            // Nếu mật khẩu nhập vào khớp với mật khẩu trong DB, thử đăng ký lại (đồng bộ)
            try {
              const newUser = await register(loginEmail, password);
              setUser({ ...newUser, ...firestoreUser });
              navigate("/dashboard");
              return;
            } catch (regError: any) {
              if (regError.code === 'auth/email-already-in-use') {
                alert("Mật khẩu của bạn đã được thay đổi. Vui lòng thử đăng nhập bằng MẬT KHẨU CŨ NHẤT của bạn để hệ thống đồng bộ lại.");
              } else {
                alert("Lỗi hệ thống: " + regError.message);
              }
              return;
            }
          }
        }
      }

      // Trường hợp 2: Tạo tài khoản Giáo viên/Admin lần đầu
      if (role === "teacher" && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') && !firestoreUser) {
        try {
          const newUser = await register(loginEmail, password);
          await addTeacher({
            username: loginEmail.split('@')[0],
            email: loginEmail,
            name: "Giáo viên",
            isAdmin: true,
            password: password 
          });
          alert("Tài khoản giáo viên mới đã được tạo thành công!");
          setUser({ ...newUser, role: 'teacher', isAdmin: true });
          navigate("/dashboard");
          return;
        } catch (regError) {
          console.error("Auto-registration failed:", regError);
        }
      }
      
      alert("Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.");
    }
  };

  const setDemoUser = (demoRole: string) => {
    setRole(demoRole);
    if (demoRole === "student") {
      setEmail("HS001");
    } else if (demoRole === "parent") {
      setEmail("PH001");
    } else {
      setEmail(`${demoRole}@school.com`);
    }
    setPassword("123456");
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-sky-500 p-8 text-center text-white">
          <BookOpen className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Lớp Học Đảo Ngược</h1>
          <p className="text-sky-100 mt-2">Học tập thông minh, vui vẻ mỗi ngày!</p>
        </div>
        
        <div className="p-8">
          <div className="flex justify-center gap-4 mb-8">
            <button onClick={() => setDemoUser("student")} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${role === "student" ? "border-sky-500 bg-sky-50 text-sky-600" : "border-gray-100 text-gray-400 hover:border-sky-200"}`}>
              <User className="w-8 h-8 mb-1" />
              <span className="text-sm font-medium">Học sinh</span>
            </button>
            <button onClick={() => setDemoUser("teacher")} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${role === "teacher" ? "border-amber-500 bg-amber-50 text-amber-600" : "border-gray-100 text-gray-400 hover:border-amber-200"}`}>
              <GraduationCap className="w-8 h-8 mb-1" />
              <span className="text-sm font-medium">Giáo viên</span>
            </button>
            <button onClick={() => setDemoUser("parent")} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${role === "parent" ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-gray-100 text-gray-400 hover:border-emerald-200"}`}>
              <Users className="w-8 h-8 mb-1" />
              <span className="text-sm font-medium">Phụ huynh</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all" placeholder="VD: HS001 hoặc email..." required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all" placeholder="Nhập mật khẩu..." required />
            </div>
            <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md hover:shadow-lg mt-4">
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
