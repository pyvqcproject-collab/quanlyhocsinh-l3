import React, { useState, useEffect } from "react";
import { getAssignments, getSubmissions, createAssignment, gradeSubmission, getStudents, addStudent, updateAssignment, deleteAssignment, updateStudent, deleteStudent, undoLastAction, getPosts, createPost, deletePost, updatePost, getAppSettings, updateAppSettings, getTeachers, addTeacher, updateTeacher, deleteTeacher } from "../firebase/db";
import { updateUserPassword, updateUserEmail, logout } from "../firebase/auth";
import { Plus, FileText, Video, PenTool, CheckCircle, Sparkles, BarChart2, Users, Edit, Trash2, Upload, Download, Undo2, Image as ImageIcon, Paperclip, Settings, X, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";

import { useAuth } from "../context/AuthContext";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<any>({});
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ teacherName: "", schoolName: "", className: "", avatarUrl: "", appName: "" });
  const [activeTab, setActiveTab] = useState("assignments");
  const [isCreating, setIsCreating] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", imageUrl: "", type: "essay", dueDate: "", videoUrl: "", gradingType: "level", questions: [] as any[] });
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [newStudent, setNewStudent] = useState({ username: "", password: "", name: "", gender: "", birthdate: "", avatarUrl: "" });
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [newTeacher, setNewTeacher] = useState({ username: "", password: "", name: "", avatarUrl: "", isAdmin: false });
  const [newPost, setNewPost] = useState<{ content: string, imageUrl: string, videoUrl: string, files: { name: string, type: string, data: string }[] }>({ content: "", imageUrl: "", videoUrl: "", files: [] });
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const as = await getAssignments();
    const su = await getSubmissions();
    const st = await getStudents();
    const te = await getTeachers();
    const po = await getPosts();
    const set = await getAppSettings();
    setAssignments(as);
    setSubmissions(su);
    setStudents(st);
    setTeachers(te);
    setPosts(po);
    setAppSettings(set);
    setSettingsForm({
      teacherName: (set as any).teacherName || "",
      schoolName: (set as any).schoolName || "",
      className: (set as any).className || "",
      avatarUrl: (set as any).avatarUrl || "",
      appName: (set as any).appName || ""
    });
  };

  const handleUndo = () => {
    if (undoLastAction()) {
      loadData();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, newAssignment);
        setEditingAssignment(null);
      } else {
        await createAssignment({ ...newAssignment, status: "active" });
      }
      setIsCreating(false);
      setNewAssignment({ title: "", description: "", imageUrl: "", type: "essay", dueDate: "", videoUrl: "", gradingType: "level", questions: [] });
      loadData();
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    await deleteAssignment(id);
    loadData();
  };

  const handleEditAssignment = (a: any) => {
    setEditingAssignment(a);
    setNewAssignment({ title: a.title || "", description: a.description || "", imageUrl: a.imageUrl || "", type: a.type || "essay", dueDate: a.dueDate || "", videoUrl: a.videoUrl || "", gradingType: a.gradingType || "level", questions: a.questions || [] });
    setIsCreating(true);
  };

  const handleAddQuestion = () => {
    setNewAssignment({
      ...newAssignment,
      questions: [...newAssignment.questions, { q: "", options: ["", "", "", ""], answer: "", time: 0 }]
    });
  };

  const handleQuestionChange = (index: number, field: string, value: any, optIndex?: number) => {
    const updated = [...newAssignment.questions];
    if (field === 'options' && optIndex !== undefined) {
      updated[index].options[optIndex] = value;
    } else {
      updated[index][field] = value;
    }
    setNewAssignment({ ...newAssignment, questions: updated });
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = newAssignment.questions.filter((_, i) => i !== index);
    setNewAssignment({ ...newAssignment, questions: updated });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const studentId = newStudent.username.toLowerCase();
      if (editingStudent) {
        await updateStudent(editingStudent.id, { ...newStudent, id: studentId, email: `${studentId}@school.com` });
        setEditingStudent(null);
      } else {
        await addStudent({ ...newStudent, id: studentId, email: `${studentId}@school.com` });
      }
      setIsAddingStudent(false);
      setNewStudent({ username: "", password: "", name: "", gender: "", birthdate: "", avatarUrl: "" });
      loadData();
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudent(id);
    loadData();
  };

  const handleEditStudent = (s: any) => {
    setEditingStudent(s);
    setNewStudent({ username: s.id.startsWith('student-') ? s.email.split('@')[0] : s.id, password: s.password || "", name: s.name || "", gender: s.gender || "", birthdate: s.birthdate || "", avatarUrl: s.avatarUrl || "" });
    setIsAddingStudent(true);
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const teacherId = newTeacher.username.toLowerCase();
      const teacherEmail = `${teacherId}@school.com`;
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, { ...newTeacher, id: teacherId, email: teacherEmail });
        if (editingTeacher.email?.toLowerCase() === user?.email?.toLowerCase()) {
          try {
            if (newTeacher.password) await updateUserPassword(newTeacher.password);
            if (teacherEmail !== editingTeacher.email?.toLowerCase()) await updateUserEmail(teacherEmail);
          } catch (authError: any) {
            alert("Đã cập nhật DB nhưng Auth yêu cầu bạn đăng xuất và đăng nhập lại để đổi mật khẩu.");
          }
        }
        setEditingTeacher(null);
      } else {
        await addTeacher({ ...newTeacher, id: teacherId, email: teacherEmail });
      }
      setIsAddingTeacher(false);
      setNewTeacher({ username: "", password: "", name: "", avatarUrl: "", isAdmin: false });
      loadData();
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    await deleteTeacher(id);
    loadData();
  };

  const handleEditTeacher = (t: any) => {
    setEditingTeacher(t);
    setNewTeacher({ username: t.id.startsWith('teacher-') ? t.email.split('@')[0] : t.id, password: t.password || "", name: t.name || "", avatarUrl: t.avatarUrl || "", isAdmin: t.isAdmin || false });
    setIsAddingTeacher(true);
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) await updatePost(editingPost.id, newPost);
    else await createPost(newPost);
    setIsCreatingPost(false);
    setNewPost({ content: "", imageUrl: "", videoUrl: "", files: [] });
    loadData();
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
    await updateAppSettings(settingsForm);
    setIsEditingSettings(false);
    loadData();
  };

  const suggestComment = async (content: string, studentName: string) => {
    try {
      const res = await fetch("/api/ai/suggest-comment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, studentName }) });
      return await res.json();
    } catch (e) {
      return { comment: "Bài làm tốt.", level: "Hoàn thành" };
    }
  };

  const chartData = assignments.map(a => {
    const subs = submissions.filter(s => s.assignmentId === a.id && s.status === "graded");
    return {
      name: a.title.substring(0, 10),
      'Tốt': subs.filter(s => s.level === "Hoàn thành tốt" || (s.score >= 8)).length,
      'Đạt': subs.filter(s => s.level === "Hoàn thành" || (s.score >= 5 && s.score < 8)).length,
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
                  <th className="p-4 font-semibold text-slate-600">Tên đăng nhập</th>
                  <th className="p-4 font-semibold text-slate-600">Họ tên</th>
                  <th className="p-4 font-semibold text-slate-600">Quyền</th>
                  <th className="p-4 font-semibold text-slate-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{t.id}</td>
                    <td className="p-4 text-slate-600">{t.name}</td>
                    <td className="p-4 text-slate-600">{t.isAdmin ? "Admin" : "Giáo viên"}</td>
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
            <h2 className="text-2xl font-bold text-slate-800">Bài tập</h2>
            <button onClick={() => setIsCreating(true)} className="bg-sky-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" /> Giao bài</button>
          </div>

          {isCreating && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-4">{editingAssignment ? "Sửa bài tập" : "Giao bài tập"}</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <input type="text" placeholder="Tiêu đề" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                <textarea placeholder="Mô tả" value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none min-h-[100px]"></textarea>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select value={newAssignment.type} onChange={e => setNewAssignment({...newAssignment, type: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none">
                    <option value="essay">Tự luận</option>
                    <option value="quiz">Trắc nghiệm</option>
                    <option value="video">Video</option>
                    <option value="drawing">Vẽ tranh</option>
                  </select>
                  <select value={newAssignment.gradingType} onChange={e => setNewAssignment({...newAssignment, gradingType: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none">
                    <option value="level">Mức độ</option>
                    <option value="score">Điểm số</option>
                  </select>
                  <input type="date" value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                </div>
                {newAssignment.type === 'quiz' && (
                  <div className="pt-4 border-t border-slate-100">
                    <button type="button" onClick={handleAddQuestion} className="text-sky-600 font-medium mb-4">+ Thêm câu hỏi</button>
                    {newAssignment.questions.map((q, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 relative">
                        <button type="button" onClick={() => handleRemoveQuestion(i)} className="absolute top-2 right-2 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        <input type="text" placeholder="Câu hỏi" value={q.q} onChange={e => handleQuestionChange(i, 'q', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 mb-2" required />
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt: string, optIdx: number) => (
                            <input key={optIdx} type="text" placeholder={`Lựa chọn ${optIdx + 1}`} value={opt} onChange={e => handleQuestionChange(i, 'options', e.target.value, optIdx)} className="px-3 py-2 rounded-lg border border-slate-200" required />
                          ))}
                        </div>
                        <select value={q.answer} onChange={e => handleQuestionChange(i, 'answer', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-2" required>
                          <option value="">Đáp án đúng</option>
                          {q.options.map((opt: string) => opt && <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsCreating(false); setEditingAssignment(null); }} className="px-4 py-2 text-slate-600">Hủy</button>
                  <button type="submit" className="bg-sky-500 text-white px-6 py-2 rounded-xl">Lưu</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map(a => (
              <div key={a.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-1">{a.title}</h3>
                <p className="text-xs text-slate-500 mb-3">Hạn: {a.dueDate}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-sm font-medium text-slate-600">Đã nộp: {submissions.filter(s => s.assignmentId === a.id).length}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditAssignment(a)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteAssignment(a.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Chấm bài</h2>
          <div className="grid gap-6">
            {submissions.filter(s => s.status === "submitted").map(sub => {
              const student = students.find(st => st.id === sub.studentId);
              const assignment = assignments.find(a => a.id === sub.assignmentId);
              return (
                <SubmissionCard key={sub.id} sub={sub} assignment={assignment} studentName={student?.name || sub.studentId} onGrade={handleGrade} suggestComment={suggestComment} />
              );
            })}
            {submissions.filter(s => s.status === "submitted").length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Đã chấm xong tất cả bài tập.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Thống kê</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500">Sĩ số</p>
              <p className="text-2xl font-bold text-slate-800">{students.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500">Bài tập đã giao</p>
              <p className="text-2xl font-bold text-slate-800">{assignments.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500">Tỷ lệ nộp bài</p>
              <p className="text-2xl font-bold text-slate-800">
                {assignments.length > 0 && students.length > 0 ? Math.round((submissions.length / (assignments.length * students.length)) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tốt" fill="#10b981" />
                <Bar dataKey="Đạt" fill="#3b82f6" />
                <Bar dataKey="Chưa đạt" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "posts" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Bảng tin</h2>
            <button onClick={() => setIsCreatingPost(true)} className="bg-sky-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" /> Đăng bài</button>
          </div>

          {isCreatingPost && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <textarea value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none min-h-[100px]" placeholder="Nội dung thông báo..." required></textarea>
                <div className="flex justify-between items-center">
                  <label className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-medium cursor-pointer flex items-center gap-2">
                    <Paperclip className="w-5 h-5" /> Đính kèm file
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
                    <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold">GV</div>
                    <div>
                      <h4 className="font-bold text-slate-800">Giáo viên</h4>
                      <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingPost(post); setNewPost({ ...post }); setIsCreatingPost(true); }} className="p-2 text-amber-500"><Edit className="w-4 h-4" /></button>
                    <button onClick={async () => { await deletePost(post.id); loadData(); }} className="p-2 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap mb-4">{post.content}</p>
                {post.files?.map((f: any, i: number) => (
                  <div key={i} className="mb-2">
                    {f.type.startsWith('image/') ? (
                      <img src={f.data} alt={f.name} className="max-w-full h-auto rounded-xl" />
                    ) : (
                      <a href={f.data} download={f.name} className="text-sky-600 flex items-center gap-2"><Paperclip className="w-4 h-4" /> {f.name}</a>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Cài đặt</h2>
            <button onClick={() => setIsEditingSettings(!isEditingSettings)} className="bg-sky-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors">
              <Edit className="w-5 h-5" /> {isEditingSettings ? "Hủy" : "Chỉnh sửa"}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            {isEditingSettings ? (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" placeholder="Tên ứng dụng" value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                  <input type="text" placeholder="Tên giáo viên" value={settingsForm.teacherName} onChange={e => setSettingsForm({...settingsForm, teacherName: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                  <input type="text" placeholder="Tên trường" value={settingsForm.schoolName} onChange={e => setSettingsForm({...settingsForm, schoolName: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                  <input type="text" placeholder="Tên lớp" value={settingsForm.className} onChange={e => setSettingsForm({...settingsForm, className: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                </div>
                <button type="submit" className="bg-sky-500 text-white px-6 py-2 rounded-xl">Lưu</button>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div><p className="text-sm text-slate-500">Tên ứng dụng</p><p className="font-medium">{appSettings.appName || "Chúng mình cùng học"}</p></div>
                <div><p className="text-sm text-slate-500">Giáo viên</p><p className="font-medium">{appSettings.teacherName || "Cô giáo"}</p></div>
                <div><p className="text-sm text-slate-500">Trường</p><p className="font-medium">{appSettings.schoolName || "Trường Tiểu học ABC"}</p></div>
                <div><p className="text-sm text-slate-500">Lớp</p><p className="font-medium">{appSettings.className || "Lớp 3A"}</p></div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-4">Đổi thông tin đăng nhập</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const newUsername = (form.elements.namedItem('newUsername') as HTMLInputElement).value.trim();
              const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
              const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
              if (newPassword && newPassword !== confirmPassword) { alert("Mật khẩu không khớp!"); return; }
              const currentTeacher = teachers.find(t => t.email?.toLowerCase() === user?.email?.toLowerCase());
              if (currentTeacher) {
                try {
                  const updates: any = {};
                  const newEmail = newUsername ? `${newUsername.toLowerCase()}@school.com` : currentTeacher.email;
                  if (newUsername) { updates.id = newUsername.toLowerCase(); updates.email = newEmail; }
                  if (newPassword) updates.password = newPassword;
                  await updateTeacher(currentTeacher.id, updates);
                  try {
                    if (newPassword) await updateUserPassword(newPassword);
                    if (newUsername && newEmail !== currentTeacher.email) await updateUserEmail(newEmail);
                    alert("Thành công! Hãy đăng xuất và đăng nhập lại.");
                  } catch (e) { alert("Đã lưu vào DB nhưng Auth yêu cầu đăng nhập lại để đổi mật khẩu."); }
                } catch (e: any) { alert("Lỗi: " + e.message); }
              }
            }} className="space-y-4 max-w-md">
              <input type="text" name="newUsername" placeholder="Tên đăng nhập mới" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" />
              <input type="password" name="newPassword" placeholder="Mật khẩu mới" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" />
              <input type="password" name="confirmPassword" placeholder="Xác nhận mật khẩu" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" />
              <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-xl w-full">Cập nhật</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ sub, assignment, studentName, onGrade, suggestComment }: any) {
  const [comment, setComment] = useState("");
  const [level, setLevel] = useState("Hoàn thành");
  const [score, setScore] = useState<number | "">("");
  const [loadingAI, setLoadingAI] = useState(false);

  const handleSuggest = async () => {
    setLoadingAI(true);
    const suggestion = await suggestComment(sub.content, studentName);
    if (suggestion) {
      setComment(suggestion.comment || "");
      if (suggestion.level) setLevel(suggestion.level);
    }
    setLoadingAI(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="mb-4">
        <h3 className="font-bold text-lg">{assignment?.title || "Bài tập"}</h3>
        <p className="text-sm text-slate-500">Học sinh: {studentName}</p>
      </div>
      <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
        {assignment?.type === 'drawing' ? (
          <img src={sub.content} alt="Bài vẽ" className="max-w-full h-auto rounded-xl" />
        ) : (
          <p className="text-slate-700 whitespace-pre-wrap">{typeof sub.content === 'string' ? sub.content : JSON.stringify(sub.content)}</p>
        )}
      </div>
      <div className="space-y-4">
        <button onClick={handleSuggest} disabled={loadingAI} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
          <Sparkles className="w-4 h-4" /> {loadingAI ? "AI đang gợi ý..." : "AI Gợi ý nhận xét"}
        </button>
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Nhận xét..." className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none min-h-[100px]" />
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {assignment?.gradingType === 'score' ? (
              <input type="number" value={score} onChange={e => setScore(e.target.value ? Number(e.target.value) : "")} className="w-20 px-3 py-2 rounded-xl border border-slate-200 text-center font-bold" placeholder="Điểm" />
            ) : (
              ["Hoàn thành tốt", "Hoàn thành", "Chưa hoàn thành"].map(l => (
                <button key={l} onClick={() => setLevel(l)} className={`px-4 py-2 rounded-xl border-2 font-medium transition-colors ${level === l ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-100 text-slate-500'}`}>{l}</button>
              ))
            )}
          </div>
          <button onClick={() => onGrade(sub.id, { comment, level: assignment?.gradingType === 'score' ? undefined : level, score: assignment?.gradingType === 'score' ? score : undefined })} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold">Lưu</button>
        </div>
      </div>
    </div>
  );
}
