import React, { useState, useEffect } from "react";
import { getStudents, getTeachers, addStudent, addTeacher, updateStudent, updateTeacher, deleteStudent, deleteTeacher, getAssignments, createAssignment, updateAssignment, deleteAssignment, getSubmissions, gradeSubmission, getPosts, createPost, deletePost, updatePost, getAppSettings, updateAppSettings, undoLastAction } from "../firebase/db";
import { Plus, Edit, Trash2, CheckCircle, XCircle, FileText, MessageSquare, Download, Upload, Undo2, Settings, Image as ImageIcon } from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<any>({ teacherName: "", schoolName: "", className: "", avatarUrl: "", appName: "" });
  
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [editingPost, setEditingPost] = useState<any>(null);
  
  const [newStudent, setNewStudent] = useState({ username: "", name: "", password: "", gender: "", birthdate: "" });
  const [newTeacher, setNewTeacher] = useState({ username: "", name: "", password: "", avatarUrl: "", isAdmin: false });
  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", dueDate: "", type: "quiz" });
  const [newPost, setNewPost] = useState({ content: "", type: "announcement", files: [] as any[] });
  
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  const loadData = async () => {
    const [s, t, a, sub, p, settings] = await Promise.all([
      getStudents(), getTeachers(), getAssignments(), getSubmissions(), getPosts(), getAppSettings()
    ]);
    setStudents(s);
    setTeachers(t);
    setAssignments(a);
    setSubmissions(sub);
    setPosts(p);
    setAppSettings(settings);
  };

  useEffect(() => { loadData(); }, []);

  const handleUndo = () => {
    if (undoLastAction()) {
      loadData();
      alert("Đã hoàn tác hành động cuối cùng!");
    } else {
      alert("Không có hành động nào để hoàn tác.");
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, { ...newStudent, email: `${newStudent.username.toLowerCase()}@school.com` });
      } else {
        await addStudent({ ...newStudent, email: `${newStudent.username.toLowerCase()}@school.com` });
      }
      setIsAddingStudent(false);
      setEditingStudent(null);
      setNewStudent({ username: "", name: "", password: "", gender: "", birthdate: "" });
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, { ...newTeacher, email: `${newTeacher.username.toLowerCase()}@school.com` });
      } else {
        await addTeacher({ ...newTeacher, email: `${newTeacher.username.toLowerCase()}@school.com` });
      }
      setIsAddingTeacher(false);
      setEditingTeacher(null);
      setNewTeacher({ username: "", name: "", password: "", avatarUrl: "", isAdmin: false });
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAssignment) {
      await updateAssignment(editingAssignment.id, newAssignment);
    } else {
      await createAssignment({ ...newAssignment, createdAt: new Date().toISOString() });
    }
    setIsCreatingAssignment(false);
    setEditingAssignment(null);
    setNewAssignment({ title: "", description: "", dueDate: "", type: "quiz" });
    loadData();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) {
      await updatePost(editingPost.id, newPost);
    } else {
      await createPost({ ...newPost, authorId: user?.id, authorName: user?.name || "Giáo viên" });
    }
    setIsCreatingPost(false);
    setEditingPost(null);
    setNewPost({ content: "", type: "announcement", files: [] });
    loadData();
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa học sinh này?")) {
      await deleteStudent(id);
      loadData();
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa giáo viên này?")) {
      await deleteTeacher(id);
      loadData();
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài tập này?")) {
      await deleteAssignment(id);
      loadData();
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) {
      await deletePost(id);
      loadData();
    }
  };

  const handleEditStudent = (s: any) => {
    setEditingStudent(s);
    setNewStudent({ username: s.id.startsWith('hs') ? s.email.split('@')[0] : s.id, name: s.name, password: s.password || "", gender: s.gender || "", birthdate: s.birthdate || "" });
    setIsAddingStudent(true);
  };

  const handleEditTeacher = (t: any) => {
    setEditingTeacher(t);
    setNewTeacher({ username: t.id.startsWith('teacher-') ? t.email.split('@')[0] : t.id, password: t.password || "", name: t.name || "", avatarUrl: t.avatarUrl || "", isAdmin: t.isAdmin || false });
    setIsAddingTeacher(true);
  };

  const downloadStudentTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { username: "HS001", name: "Nguyễn Văn A", password: "123", gender: "Nam", birthdate: "2015-01-01" },
      { username: "HS002", name: "Trần Thị B", password: "123", gender: "Nữ", birthdate: "2015-02-02" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HocSinh");
    XLSX.writeFile(wb, "Mau_Nhap_Hoc_Sinh.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      for (const row of data as any[]) {
        if (row.username && row.name) {
          await addStudent({ username: row.username, name: row.name, password: row.password || "123456", gender: row.gender || "", birthdate: row.birthdate || "", email: `${row.username.toLowerCase()}@school.com` });
        }
      }
      loadData();
      alert("Đã nhập thành công!");
    };
    reader.readAsBinaryString(file);
  };

  const exportResults = () => {
    const data = students.map(s => {
      const row: any = { "Mã số": s.id, "Họ tên": s.name };
      assignments.forEach(a => {
        const sub = submissions.find(sub => sub.studentId === s.id && sub.assignmentId === a.id);
        row[a.title] = sub ? sub.level || sub.score : "Chưa nộp";
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KetQua");
    XLSX.writeFile(wb, "Ket_Qua_Hoc_Tap.xlsx");
  };

  const handleFileUploadPost = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewPost(prev => ({ ...prev, files: [...prev.files, { name: file.name, type: file.type, data: event.target!.result as string }] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGrade = async (subId: string, data: any) => {
    await gradeSubmission(subId, data);
    loadData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAppSettings(appSettings);
    alert("Đã lưu cài đặt!");
    window.dispatchEvent(new Event('appSettingsChanged'));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAppSettings({ ...appSettings, avatarUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTeacherAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewTeacher({ ...newTeacher, avatarUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyticsData = assignments.map(a => {
    const subs = submissions.filter(s => s.assignmentId === a.id);
    return {
      title: a.title,
      'Hoàn thành tốt': subs.filter(s => s.level === "Hoàn thành tốt" || s.score >= 8).length,
      'Hoàn thành': subs.filter(s => s.level === "Hoàn thành" || (s.score >= 5 && s.score < 8)).length,
      'Chưa đạt': subs.filter(s => s.level === "Chưa hoàn thành" || (s.score < 5)).length,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 pb-2 overflow-x-auto justify-between items-center">
        <div className="flex gap-4">
          <button onClick={() => setActiveTab("students")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "students" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500"}`}>Học sinh</button>
          {user?.isAdmin && <button onClick={() => setActiveTab("teachers")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "teachers" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500"}`}>Giáo viên</button>}
          <button onClick={() => setActiveTab("assignments")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "assignments" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500"}`}>Bài tập</button>
          <button onClick={() => setActiveTab("submissions")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "submissions" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500"}`}>Chấm bài</button>
          <button onClick={() => setActiveTab("analytics")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "analytics" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500"}`}>Thống kê</button>
          <button onClick={() => setActiveTab("posts")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "posts" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500"}`}>Bảng tin</button>
          <button onClick={() => setActiveTab("settings")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "settings" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500"}`}>Cài đặt</button>
        </div>
        <button onClick={handleUndo} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          <Undo2 className="w-4 h-4" /> Hoàn tác
        </button>
      </div>

      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Danh sách học sinh</h2>
            <div className="flex gap-3">
              <input type="text" placeholder="Tìm kiếm..." value={studentSearchTerm} onChange={(e) => setStudentSearchTerm(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" />
              <button onClick={exportResults} className="bg-indigo-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Download className="w-5 h-5" /> Xuất Excel</button>
              <button onClick={downloadStudentTemplate} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Download className="w-5 h-5" /> Tải mẫu</button>
              <label className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors cursor-pointer"><Upload className="w-5 h-5" /> Nhập Excel<input type="file" className="hidden" onChange={handleFileUpload} /></label>
              <button onClick={() => setIsAddingStudent(true)} className="bg-sky-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" /> Thêm</button>
            </div>
          </div>

          {isAddingStudent && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-4">{editingStudent ? "Sửa học sinh" : "Thêm học sinh"}</h3>
              <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input type="text" placeholder="Tên đăng nhập" value={newStudent.username} onChange={e => setNewStudent({...newStudent, username: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                <input type="text" placeholder="Họ và tên" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                <input type="text" placeholder="Mật khẩu" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                <select value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none">
                  <option value="">Giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
                <input type="date" value={newStudent.birthdate} onChange={e => setNewStudent({...newStudent, birthdate: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" />
                <div className="sm:col-span-3 flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsAddingStudent(false); setEditingStudent(null); }} className="px-4 py-2 text-slate-600">Hủy</button>
                  <button type="submit" className="bg-sky-500 text-white px-6 py-2 rounded-xl">Lưu</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold text-slate-600">Mã số</th>
                  <th className="p-4 font-semibold text-slate-600">Họ tên</th>
                  <th className="p-4 font-semibold text-slate-600">Ngày sinh</th>
                  <th className="p-4 font-semibold text-slate-600">Giới tính</th>
                  <th className="p-4 font-semibold text-slate-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {students.filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) || s.id.toLowerCase().includes(studentSearchTerm.toLowerCase())).map(s => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{s.id}</td>
                    <td className="p-4 text-slate-600">{s.name}</td>
                    <td className="p-4 text-slate-600">{s.birthdate}</td>
                    <td className="p-4 text-slate-600">{s.gender}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditStudent(s)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteStudent(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "teachers" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Danh sách giáo viên</h2>
            <button onClick={() => setIsAddingTeacher(true)} className="bg-sky-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" /> Thêm</button>
          </div>

          {isAddingTeacher && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-4">{editingTeacher ? "Sửa giáo viên" : "Thêm giáo viên"}</h3>
              <form onSubmit={handleAddTeacher} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Tên đăng nhập" value={newTeacher.username} onChange={e => setNewTeacher({...newTeacher, username: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                <input type="text" placeholder="Họ và tên" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                <input type="text" placeholder="Mật khẩu" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isAdmin" checked={newTeacher.isAdmin} onChange={e => setNewTeacher({...newTeacher, isAdmin: e.target.checked})} />
                  <label htmlFor="isAdmin">Quyền Admin</label>
                </div>
                <div className="sm:col-span-2 flex items-center gap-4">
                  {newTeacher.avatarUrl ? (
                    <img src={newTeacher.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl cursor-pointer transition-colors text-sm font-medium">
                    Tải ảnh lên
                    <input type="file" className="hidden" accept="image/*" onChange={handleTeacherAvatarUpload} />
                  </label>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsAddingTeacher(false); setEditingTeacher(null); }} className="px-4 py-2 text-slate-600">Hủy</button>
                  <button type="submit" className="bg-sky-500 text-white px-6 py-2 rounded-xl">Lưu</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold text-slate-600">Ảnh</th>
                  <th className="p-4 font-semibold text-slate-600">Tên đăng nhập</th>
                  <th className="p-4 font-semibold text-slate-600">Họ tên</th>
                  <th className="p-4 font-semibold text-slate-600">Quyền</th>
                  <th className="p-4 font-semibold text-slate-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4">
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold">
                          {t.name?.charAt(0) || 'T'}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-slate-800">{t.id}</td>
                    <td className="p-4 text-slate-600">{t.name}</td>
                    <td className="p-4 text-slate-600">
                      {t.isAdmin ? <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded text-xs font-bold">Admin</span> : "Giáo viên"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditTeacher(t)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteTeacher(t.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Quản lý bài tập</h2>
            <button onClick={() => setIsCreatingAssignment(true)} className="bg-sky-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" /> Giao bài mới</button>
          </div>

          {isCreatingAssignment && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-4">{editingAssignment ? "Sửa bài tập" : "Giao bài tập mới"}</h3>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <input type="text" placeholder="Tiêu đề bài tập" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                <textarea placeholder="Mô tả chi tiết..." value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none h-32" required />
                <div className="flex gap-4">
                  <input type="date" value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                  <select value={newAssignment.type} onChange={e => setNewAssignment({...newAssignment, type: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none">
                    <option value="quiz">Trắc nghiệm</option>
                    <option value="essay">Tự luận</option>
                    <option value="project">Dự án</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsCreatingAssignment(false); setEditingAssignment(null); }} className="px-4 py-2 text-slate-600">Hủy</button>
                  <button type="submit" className="bg-sky-500 text-white px-6 py-2 rounded-xl">Lưu bài tập</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map(a => (
              <div key={a.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-sky-50 text-sky-500 rounded-xl"><FileText className="w-6 h-6" /></div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingAssignment(a); setNewAssignment(a); setIsCreatingAssignment(true); }} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteAssignment(a.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{a.title}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{a.description}</p>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className={`px-3 py-1 rounded-full ${a.type === 'quiz' ? 'bg-purple-50 text-purple-600' : a.type === 'essay' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {a.type === 'quiz' ? 'Trắc nghiệm' : a.type === 'essay' ? 'Tự luận' : 'Dự án'}
                  </span>
                  <span className="text-rose-500">Hạn: {a.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Chấm bài</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold text-slate-600">Học sinh</th>
                  <th className="p-4 font-semibold text-slate-600">Bài tập</th>
                  <th className="p-4 font-semibold text-slate-600">Trạng thái</th>
                  <th className="p-4 font-semibold text-slate-600">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => {
                  const student = students.find(st => st.id === s.studentId);
                  const assignment = assignments.find(a => a.id === s.assignmentId);
                  return (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800">{student?.name || s.studentId}</td>
                      <td className="p-4 text-slate-600">{assignment?.title || s.assignmentId}</td>
                      <td className="p-4">
                        {s.status === "graded" ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold"><CheckCircle className="w-4 h-4" /> Đã chấm</span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-500 text-sm font-bold"><XCircle className="w-4 h-4" /> Chờ chấm</span>
                        )}
                      </td>
                      <td className="p-4">
                        {s.status === "graded" ? (
                          <span className="font-bold text-slate-700">{s.level || `${s.score} điểm`}</span>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => handleGrade(s.id, { level: "Hoàn thành tốt" })} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-100">Tốt</button>
                            <button onClick={() => handleGrade(s.id, { level: "Hoàn thành" })} className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-sm font-bold hover:bg-sky-100">Đạt</button>
                            <button onClick={() => handleGrade(s.id, { level: "Chưa hoàn thành" })} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-100">Chưa đạt</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Thống kê học tập</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-slate-500 font-medium mb-2">Tổng số học sinh</h3>
              <p className="text-4xl font-black text-slate-800">{students.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-slate-500 font-medium mb-2">Bài tập đã giao</h3>
              <p className="text-4xl font-black text-sky-500">{assignments.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-slate-500 font-medium mb-2">Bài đã nộp</h3>
              <p className="text-4xl font-black text-emerald-500">{submissions.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg mb-6">Kết quả theo bài tập</h3>
            <div className="space-y-4">
              {analyticsData.map((data, i) => {
                const total = data['Hoàn thành tốt'] + data['Hoàn thành'] + data['Chưa đạt'];
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{data.title}</span>
                      <span className="text-slate-500">{total} bài nộp</span>
                    </div>
                    {total > 0 ? (
                      <div className="h-4 flex rounded-full overflow-hidden">
                        <div style={{ width: `${(data['Hoàn thành tốt'] / total) * 100}%` }} className="bg-emerald-500" title={`Tốt: ${data['Hoàn thành tốt']}`}></div>
                        <div style={{ width: `${(data['Hoàn thành'] / total) * 100}%` }} className="bg-sky-500" title={`Đạt: ${data['Hoàn thành']}`}></div>
                        <div style={{ width: `${(data['Chưa đạt'] / total) * 100}%` }} className="bg-rose-500" title={`Chưa đạt: ${data['Chưa đạt']}`}></div>
                      </div>
                    ) : (
                      <div className="h-4 bg-slate-100 rounded-full"></div>
                    )}
                    <div className="flex gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Tốt ({data['Hoàn thành tốt']})</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sky-500"></div> Đạt ({data['Hoàn thành']})</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Chưa đạt ({data['Chưa đạt']})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "posts" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Bảng tin lớp học</h2>
            <button onClick={() => setIsCreatingPost(true)} className="bg-sky-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" /> Đăng bài</button>
          </div>

          {isCreatingPost && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-4">{editingPost ? "Sửa bài đăng" : "Tạo bài đăng mới"}</h3>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <textarea placeholder="Nội dung bài đăng..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none h-32 resize-none" required />
                <div className="flex justify-between items-center">
                  <select value={newPost.type} onChange={e => setNewPost({...newPost, type: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none">
                    <option value="announcement">Thông báo</option>
                    <option value="material">Tài liệu</option>
                    <option value="discussion">Thảo luận</option>
                  </select>
                  <label className="cursor-pointer text-sky-500 hover:text-sky-600 font-medium flex items-center gap-2">
                    <Upload className="w-5 h-5" /> Đính kèm file
                    <input type="file" multiple className="hidden" onChange={handleFileUploadPost} />
                  </label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setIsCreatingPost(false); setEditingPost(null); }} className="px-4 py-2 text-slate-600">Hủy</button>
                    <button type="submit" className="bg-sky-500 text-white px-6 py-2 rounded-xl">Đăng</button>
                  </div>
                </div>
                {newPost.files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newPost.files.map((f, i) => (
                      <div key={i} className="bg-slate-50 px-3 py-1 rounded-lg text-xs flex items-center gap-2">
                        {f.name} <button type="button" onClick={() => setNewPost(prev => ({ ...prev, files: prev.files.filter((_, idx) => idx !== i) }))} className="text-rose-500">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="space-y-6">
            {posts.map(post => (
              <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold">
                      {post.authorName?.charAt(0) || "G"}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{post.authorName}</h4>
                      <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${post.type === 'announcement' ? 'bg-rose-100 text-rose-600' : post.type === 'material' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {post.type === 'announcement' ? 'Thông báo' : post.type === 'material' ? 'Tài liệu' : 'Thảo luận'}
                    </span>
                    {user?.id === post.authorId && (
                      <>
                        <button onClick={() => { setEditingPost(post); setNewPost(post); setIsCreatingPost(true); }} className="text-amber-500 hover:bg-amber-50 p-1 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeletePost(post.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap mb-4">{post.content}</p>
                {post.files && post.files.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {post.files.map((file: any, i: number) => (
                      <a key={i} href={file.data} download={file.name} className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-700 transition-colors border border-slate-200">
                        {file.type.includes('image') ? <ImageIcon className="w-4 h-4 text-sky-500" /> : <FileText className="w-4 h-4 text-rose-500" />}
                        {file.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Cài đặt ứng dụng</h2>
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
            <h3 className="font-bold text-amber-800 mb-2">⚠️ Lưu ý quan trọng về Đổi tên đăng nhập</h3>
            <p className="text-sm text-amber-700 mb-2">
              Để tính năng đổi tên đăng nhập hoạt động, bạn cần bật <b>"Email address change"</b> trong Firebase Console:
            </p>
            <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1 ml-2">
              <li>Mở Firebase Console &gt; Authentication &gt; Settings &gt; User actions.</li>
              <li>Bỏ chọn (Tắt) mục <b>"Email enumeration protection"</b>.</li>
            </ol>
          </div>

          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-6 mb-6">
                {appSettings.avatarUrl ? (
                  <img src={appSettings.avatarUrl} alt="Logo" className="w-24 h-24 rounded-2xl object-cover shadow-sm" />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Logo / Ảnh đại diện</h3>
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl cursor-pointer transition-colors text-sm font-medium">
                    Tải ảnh lên
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên ứng dụng</label>
                <input type="text" value={appSettings.appName} onChange={e => setAppSettings({...appSettings, appName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-sky-500" placeholder="VD: Lớp Học Đảo Ngược" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên giáo viên</label>
                <input type="text" value={appSettings.teacherName} onChange={e => setAppSettings({...appSettings, teacherName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-sky-500" placeholder="VD: Cô Lan" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên trường</label>
                <input type="text" value={appSettings.schoolName} onChange={e => setAppSettings({...appSettings, schoolName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-sky-500" placeholder="VD: Trường Tiểu học ABC" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên lớp</label>
                <input type="text" value={appSettings.className} onChange={e => setAppSettings({...appSettings, className: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-sky-500" placeholder="VD: Lớp 3A" />
              </div>
              <button type="submit" className="bg-sky-500 text-white px-6 py-3 rounded-xl font-bold mt-4 w-full">Lưu cài đặt</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
