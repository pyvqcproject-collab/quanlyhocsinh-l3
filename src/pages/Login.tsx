import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login, register } from "../firebase/auth";
import { addTeacher, getUser } from "../firebase/db";
import { db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
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
      
      try {
        // Check if user exists in Firestore but not in Auth (or wrong password in Auth)
        const firestoreUser = await getUser(loginEmail);
        
        if (firestoreUser) {
          // Case 1: User exists in Firestore but login failed
          if (firestoreUser.password === password) {
            // Password matches Firestore. Try to auto-register in case they don't exist in Auth.
            try {
              const newUser = await register(loginEmail, password);
              console.log("Auto-registered user:", newUser.email);
              navigate("/dashboard");
              return;
            } catch (regError: any) {
              if (regError.code === 'auth/email-already-in-use') {
                alert("Mật khẩu của bạn đã được thay đổi trong hệ thống nhưng chưa được cập nhật vào hệ thống đăng nhập. Vui lòng thử lại bằng mật khẩu CŨ nhất của bạn, hoặc liên hệ quản trị viên.");
              } else if (regError.code === 'auth/operation-not-allowed') {
                alert("Tính năng đăng nhập bằng Email/Mật khẩu chưa được bật trong Firebase Console. Vui lòng liên hệ quản trị viên.");
              } else {
                console.error("Auto-registration failed:", regError);
                alert("Đã xảy ra lỗi khi đồng bộ tài khoản. Vui lòng thử lại.");
              }
              return;
            }
          } else {
            alert("Sai mật khẩu. Vui lòng kiểm tra lại.");
            return;
          }
        }
      } catch (dbError: any) {
        console.error("Lỗi khi truy xuất Firestore trong lúc đăng nhập:", dbError);
        if (dbError.code === 'permission-denied') {
          alert("Lỗi phân quyền: Tài khoản của bạn chưa được kích hoạt trên hệ thống xác thực. Vui lòng nhờ Giáo viên tạo tài khoản cho bạn.");
          return;
        }
      }

      // Case 2: Special case for first-time teacher setup
      if (role === "teacher" && error.code === 'auth/user-not-found') {
        try {
          const newUser = await register(loginEmail, password);
          await addTeacher({
            username: loginEmail.split('@')[0],
            email: loginEmail,
            name: "Giáo viên",
            isAdmin: true,
            password: password // Store password in Firestore for sync
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
            <button type="button" onClick={() => setDemoUser("student")} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all w-24 ${role === "student" ? "border-sky-500 bg-sky-50 text-sky-600 ring-2 ring-sky-200" : "border-gray-100 text-gray-400 hover:border-sky-200"}`}>
              <User className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold uppercase">Học sinh</span>
            </button>
            <button type="button" onClick={() => setDemoUser("teacher")} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all w-24 ${role === "teacher" ? "border-amber-500 bg-amber-50 text-amber-600 ring-2 ring-amber-200" : "border-gray-100 text-gray-400 hover:border-amber-200"}`}>
              <GraduationCap className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold uppercase">Giáo viên</span>
            </button>
            <button type="button" onClick={() => setDemoUser("parent")} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all w-24 ${role === "parent" ? "border-emerald-500 bg-emerald-50 text-emerald-600 ring-2 ring-emerald-200" : "border-gray-100 text-gray-400 hover:border-emerald-200"}`}>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <input type="text" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400" placeholder="VD: HS001 hoặc email..." required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400" placeholder="Nhập mật khẩu..." required />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md hover:shadow-lg mt-4 flex justify-center items-center gap-2 disabled:bg-sky-300 disabled:cursor-not-allowed">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
