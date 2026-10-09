import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login, register } from "../firebase/auth";
import { addTeacher, getUser } from "../firebase/db";
import { db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { getAuth, deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { BookOpen, User, Users, GraduationCap, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    
    const loginEmail = email.includes("@") ? email : `${email}@school.com`;
    
    try {
      console.log("Attempting login for:", loginEmail, "with role:", role);
      const u = await login(loginEmail, password, role);
      console.log("Login successful, user:", u.email);
      
      try {
        // TỰ ĐỘNG SỬA LỖI (SELF-HEALING): Đảm bảo user có trong Firestore với đúng role
        const firestoreUser = await getUser(loginEmail);
        if (!firestoreUser || !firestoreUser.role) {
          console.log("User missing in Firestore or missing role. Auto-fixing...");
          const username = loginEmail.split('@')[0].toLowerCase();
          await setDoc(doc(db, "users", username), {
            id: username,
            email: loginEmail,
            role: role,
            name: role === 'teacher' ? 'Giáo viên' : 'Học sinh',
            isAdmin: role === 'teacher',
            password: password
          }, { merge: true });
        }
      } catch (dbErr) {
        console.error("Lỗi khi tự động sửa dữ liệu:", dbErr);
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      
      // XỬ LÝ LỖI THÔNG MINH (Bỏ qua lỗi phân quyền Firestore)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          // 1. Thử đăng ký ngầm (để lấy quyền truy cập DB)
          const newUser = await register(loginEmail, password);
          
          // 2. Đăng ký thành công -> Đã đăng nhập -> Đã có quyền đọc DB
          let firestoreUser = await getUser(loginEmail);
          
          // TỰ ĐỘNG TẠO TÀI KHOẢN PHỤ HUYNH TỪ HỌC SINH
          if (!firestoreUser && role === "parent") {
            // Lấy email học sinh tương ứng (VD: PH001 -> HS001)
            const studentEmail = loginEmail.toLowerCase().replace('ph', 'hs');
            const studentUser = await getUser(studentEmail);
            
            if (studentUser && studentUser.password === password) {
              const parentUsername = loginEmail.split('@')[0].toLowerCase();
              firestoreUser = {
                id: parentUsername,
                email: loginEmail.toLowerCase(),
                role: "parent",
                name: "Phụ huynh " + (studentUser.name || ""),
                studentId: studentUser.id,
                password: password
              };
              await setDoc(doc(db, "users", parentUsername), firestoreUser, { merge: true });
            }
          }
          
          if (firestoreUser) {
            // 3. Có trong danh sách lớp, kiểm tra mật khẩu gốc
            if (firestoreUser.password === password) {
              // Mật khẩu đúng -> Cho phép vào
              navigate("/dashboard");
            } else {
              // Mật khẩu sai -> Xóa tài khoản vừa tạo ngầm để không bị kẹt cho lần sau
              const auth = getAuth();
              if (auth.currentUser) {
                await deleteUser(auth.currentUser);
              }
              alert("Sai mật khẩu. Vui lòng kiểm tra lại.");
            }
          } else {
            // Không có trong danh sách lớp -> Xóa tài khoản rác
            const auth = getAuth();
            if (auth.currentUser) {
              await deleteUser(auth.currentUser);
            }
            
            // Xử lý riêng cho Giáo viên tạo tài khoản lần đầu
            if (role === "teacher") {
              const newTeacherUser = await register(loginEmail, password);
              await addTeacher({
                username: loginEmail.split('@')[0],
                email: loginEmail,
                name: "Giáo viên",
                isAdmin: true,
                password: password
              });
              alert("Tài khoản giáo viên mới đã được tạo thành công!");
              setUser({ ...newTeacherUser, role: 'teacher', isAdmin: true });
              navigate("/dashboard");
            } else if (role === "parent") {
              alert("Không tìm thấy học sinh tương ứng hoặc sai mật khẩu. Vui lòng kiểm tra lại.");
            } else {
              alert("Tài khoản này chưa được Giáo viên thêm vào danh sách lớp.");
            }
          }
        } catch (regError: any) {
          if (regError.code === 'auth/email-already-in-use') {
            // Đã có tài khoản Auth, nghĩa là lỗi ban đầu thực sự là do Sai Mật Khẩu
            alert("Sai mật khẩu. Vui lòng kiểm tra lại.");
          } else if (regError.code === 'auth/operation-not-allowed') {
            alert("Tính năng đăng nhập bằng Email/Mật khẩu chưa được bật trong Firebase Console.");
          } else {
            alert("Lỗi hệ thống: " + regError.message);
          }
        }
      } else {
        alert("Đăng nhập thất bại: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoUser = (demoRole: string) => {
    setRole(demoRole);
    if (demoRole === "student") {
      setEmail("HS001");
    } else if (demoRole === "parent") {
      setEmail("PH001");
    } else {
      setEmail(`${demoRole}@school.com`.toUpperCase());
    }
    setPassword("123456");
  };

  return (
    <div className="min-h-screen bg-slate-100/70 sm:bg-slate-50 flex flex-col justify-center sm:items-center p-0 sm:p-6">
      {/* Android Material Container */}
      <div className="bg-white sm:rounded-[2.5rem] sm:shadow-2xl sm:shadow-slate-300/40 border-0 sm:border border-slate-200/80 w-full max-w-md mx-auto overflow-hidden flex-1 sm:flex-none flex flex-col">
        {/* Top Hero Splash */}
        <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 p-8 sm:p-10 text-center text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border border-white/30 text-white">
              <BookOpen className="w-9 h-9" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Lớp Học Đảo Ngược</h1>
            <p className="text-sky-100 text-xs sm:text-sm font-semibold mt-1">
              Học tập thông minh, tiến bộ mỗi ngày! 🌟
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center bg-white">
          {/* Material 3 Segmented Role Switcher */}
          <div className="space-y-2 mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
              Chọn vai trò đăng nhập
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setDemoUser("student")}
                className={`flex flex-col items-center py-2.5 px-2 rounded-xl font-bold transition-all cursor-pointer ${
                  role === "student"
                    ? "bg-white text-sky-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="w-5 h-5 mb-1" />
                <span className="text-xs">Học sinh</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser("teacher")}
                className={`flex flex-col items-center py-2.5 px-2 rounded-xl font-bold transition-all cursor-pointer ${
                  role === "teacher"
                    ? "bg-white text-amber-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <GraduationCap className="w-5 h-5 mb-1" />
                <span className="text-xs">Giáo viên</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser("parent")}
                className={`flex flex-col items-center py-2.5 px-2 rounded-xl font-bold transition-all cursor-pointer ${
                  role === "parent"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users className="w-5 h-5 mb-1" />
                <span className="text-xs">Phụ huynh</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => setEmail(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all disabled:bg-slate-100 uppercase bg-slate-50/50 text-slate-800 font-semibold text-base placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                placeholder="VD: HS001 hoặc email..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all disabled:bg-slate-100 bg-slate-50/50 text-slate-800 font-semibold text-base placeholder:font-normal placeholder:text-slate-400"
                placeholder="Nhập mật khẩu..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-[0.98] text-white font-extrabold py-4 px-4 rounded-2xl transition-all shadow-lg shadow-sky-500/25 mt-4 flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập vào lớp 🚀"
              )}
            </button>
          </form>

          {/* Quick Demo Hint */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Gợi ý tài khoản thử nghiệm: <span className="font-bold text-slate-600">HS001</span> (Học sinh) / <span className="font-bold text-slate-600">teacher@school.com</span> (Giáo viên) - Mật khẩu: <span className="font-bold text-slate-600">123456</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
