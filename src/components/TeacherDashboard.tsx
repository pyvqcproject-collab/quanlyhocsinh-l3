import React, { useState, useEffect } from "react";
import { getAssignments, getSubmissions, createAssignment, gradeSubmission, getStudents, addStudent, updateAssignment, deleteAssignment, updateStudent, deleteStudent, undoLastAction, getPosts, createPost, deletePost, updatePost, getAppSettings, updateAppSettings, getTeachers, addTeacher, updateTeacher, deleteTeacher } from "../firebase/db";
import { updateUserPassword, updateUserEmail } from "../firebase/auth";
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      console.error("Error creating assignment:", error);
      alert("Không thể tạo bài tập. Vui lòng thử lại. Lỗi: " + error.message);
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
      if (editingStudent) {
        // Pass id: newStudent.username so updateStudent knows to move the document if ID changed
        await updateStudent(editingStudent.id, { ...newStudent, id: newStudent.username, email: `${newStudent.username}@school.com` });
        setEditingStudent(null);
      } else {
        // Ensure password is saved so auto-registration in Login.tsx can work
        await addStudent({ ...newStudent, email: `${newStudent.username}@school.com` });
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
      const teacherEmail = `${newTeacher.username}@school.com`;
      if (editingTeacher) {
        // Pass id: newTeacher.username so updateTeacher knows to move the document if ID changed
        await updateTeacher(editingTeacher.id, { ...newTeacher, id: newTeacher.username, email: teacherEmail });
        
        // If editing self, update Auth password and email too
        if (editingTeacher.email === user?.email) {
          try {
            if (newTeacher.password) {
              await updateUserPassword(newTeacher.password);
            }
            if (teacherEmail !== editingTeacher.email) {
              await updateUserEmail(teacherEmail);
            }
          } catch (authError: any) {
            console.error("Auth update failed:", authError);
            alert("Đã cập nhật thông tin trong DB nhưng không thể cập nhật thông tin đăng nhập (Auth). Có thể bạn cần đăng nhập lại để thực hiện việc này do yêu cầu bảo mật của Firebase.");
          }
        }
        setEditingTeacher(null);
      } else {
        await addTeacher({ ...newTeacher, email: teacherEmail });
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
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      for (const row of data as any[]) {
        if (row.username && row.name) {
          await addStudent({ username: row.username, name: row.name, password: row.password || "123456", gender: row.gender || "", birthdate: row.birthdate || "", email: `${row.username}@school.com` });
        }
      }
      loadData();
      alert("Đã thêm học sinh từ file Excel!");
    };
    reader.readAsBinaryString(file);
  };

  const downloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      { username: "HS001", name: "Nguyễn Văn A", password: "123", gender: "Nam", birthdate: "01/01/2015" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HocSinh");
    XLSX.writeFile(wb, "Mau_Nhap_Hoc_Sinh.xlsx");
  };

  const exportResults = () => {
    const data = students.map(s => {
      const row: any = {
        "Tên đăng nhập": s.id.startsWith('student-') ? s.email.split('@')[0] : s.id,
        "Họ và tên": s.name,
        "Giới tính": s.gender || "",
        "Ngày sinh": s.birthdate || ""
      };
      assignments.forEach(a => {
        const sub = submissions.find(sub => sub.studentId === s.id && sub.assignmentId === a.id);
        row[a.title] = sub ? sub.level : "Chưa làm";
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
    try {
      if (editingPost) {
        await updatePost(editingPost.id, newPost);
        setEditingPost(null);
      } else {
        await createPost(newPost);
      }
      setIsCreatingPost(false);
      setNewPost({ content: "", imageUrl: "", videoUrl: "", files: [] });
      loadData();
    } catch (error: any) {
      console.error("Error creating post:", error);
      alert("Không thể đăng bài. Vui lòng thử lại. Lỗi: " + error.message);
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setNewPost({
      content: post.content || "",
      imageUrl: post.imageUrl || "",
      videoUrl: post.videoUrl || "",
      files: post.files || []
    });
    setIsCreatingPost(true);
  };

  const handleFileUploadPost = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: File) => {
      if (file.size > 700 * 1024) {
        alert(`File ${file.name} quá lớn. Vui lòng chọn file dưới 700KB để đảm bảo hệ thống hoạt động ổn định.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewPost(prev => ({
            ...prev,
            files: [...prev.files, {
              name: file.name,
              type: file.type,
              data: event.target!.result as string
            }]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setNewPost(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleDeletePost = async (id: string) => {
    await deletePost(id);
    loadData();
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
    window.dispatchEvent(new Event('appSettingsChanged'));
  };

  const suggestComment = async (content: string, studentName: string) => {
    try {
      const res = await fetch("/api/ai/suggest-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, studentName })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.error(e);
      return { comment: "Bài làm tốt, cần cố gắng thêm.", level: "Hoàn thành" };
    }
  };

  const chartData = assignments.map(a => {
    const subs = submissions.filter(s => s.assignmentId === a.id && s.status === "graded");
    return {
      name: a.title.split(':')[0] || a.title,
      'Hoàn thành tốt': subs.filter(s => s.level === "Hoàn thành tốt" || (s.score !== undefined && s.score >= 8)).length,
      'Hoàn thành': subs.filter(s => s.level === "Hoàn thành" || (s.score !== undefined && s.score >= 5 && s.score < 8)).length,
      'Chưa hoàn thành': subs.filter(s => s.level === "Chưa hoàn thành" || (s.score !== undefined && s.score < 5)).length,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 pb-2 overflow-x-auto justify-between items-center">
        <div className="flex gap-4">
          <button onClick={() => setActiveTab("students")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap ${activeTab === "students" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Quản lý học sinh</button>
          {user?.isAdmin && (
            <button onClick={() => setActiveTab("teachers")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap ${activeTab === "teachers" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Quản lý giáo viên</button>
          )}
          <button onClick={() => setActiveTab("assignments")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap ${activeTab === "assignments" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Bài tập</button>
          <button onClick={() => setActiveTab("submissions")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap ${activeTab === "submissions" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Chấm bài</button>
          <button onClick={() => setActiveTab("analytics")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap ${activeTab === "analytics" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Thống kê</button>
          <button onClick={() => setActiveTab("posts")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap ${activeTab === "posts" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Bảng tin</button>
          <button onClick={() => setActiveTab("settings")} className={`px-4 py-2 font-medium rounded-t-lg whitespace-nowrap ${activeTab === "settings" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Cài đặt</button>
        </div>
        <button onClick={handleUndo} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" title="Hoàn tác (Ctrl+Z)">
          <Undo2 className="w-4 h-4" /> Hoàn tác
        </button>
      </div>

      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Danh sách học sinh</h2>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Tìm kiếm học sinh..." 
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none flex-grow sm:flex-grow-0 min-w-[200px]"
              />
              <button onClick={downloadSampleExcel} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors">
                <Download className="w-5 h-5" /> Tải mẫu Excel
              </button>
              <button onClick={exportResults} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors">
                <Download className="w-5 h-5" /> Xuất kết quả
              </button>
              <label className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer">
                <Upload className="w-5 h-5" /> Nhập Excel
                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
              </label>
              <button onClick={() => setIsAddingStudent(true)} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors">
                <Plus className="w-5 h-5" /> Thêm học sinh
              </button>
            </div>
          </div>

          {isAddingStudent && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">{editingStudent ? "Chỉnh sửa học sinh" : "Thêm học sinh mới"}</h3>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập (VD: HS001)</label>
                    <input type="text" value={newStudent.username} onChange={e => setNewStudent({...newStudent, username: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                    <input type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                    <input type="text" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
                    <select value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none">
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
                    <input type="date" value={newStudent.birthdate} onChange={e => setNewStudent({...newStudent, birthdate: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh đại diện (URL)</label>
                    <input type="url" value={newStudent.avatarUrl} onChange={e => setNewStudent({...newStudent, avatarUrl: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="https://..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => { setIsAddingStudent(false); setEditingStudent(null); setNewStudent({ username: "", password: "", name: "", gender: "", birthdate: "", avatarUrl: "" }); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Hủy</button>
                  <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-xl font-medium shadow-sm transition-colors">Lưu</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 font-semibold text-slate-600">Mã số</th>
                    <th className="p-4 font-semibold text-slate-600">Họ và tên</th>
                    <th className="p-4 font-semibold text-slate-600">Ngày sinh</th>
                    <th className="p-4 font-semibold text-slate-600">Giới tính</th>
                    <th className="p-4 font-semibold text-slate-600">Bài tập</th>
                    <th className="p-4 font-semibold text-slate-600 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => 
                    s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
                    s.id.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                    (s.email && s.email.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                  ).map(s => {
                    const studentSubs = submissions.filter(sub => sub.studentId === s.id);
                    const completedSubs = studentSubs.filter(sub => sub.status === 'graded' || sub.status === 'submitted');
                    const completionRate = assignments.length > 0 ? Math.round((completedSubs.length / assignments.length) * 100) : 0;
                    
                    return (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4 font-medium text-slate-800">
                          <div className="flex items-center gap-3">
                            {s.avatarUrl ? (
                              <img src={s.avatarUrl} alt={s.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">{s.name.charAt(0)}</div>
                            )}
                            {s.id.startsWith('student-') ? s.email.split('@')[0] : s.id}
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{s.name}</td>
                        <td className="p-4 text-slate-600">{s.birthdate || 'N/A'}</td>
                        <td className="p-4 text-slate-600">{s.gender || 'N/A'}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                              {assignments.slice(0, 5).map(a => {
                                const isDone = studentSubs.some(sub => sub.assignmentId === a.id && (sub.status === 'graded' || sub.status === 'submitted'));
                                return (
                                  <div key={a.id} className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`} title={a.title}>
                                    {isDone ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  </div>
                                );
                              })}
                              {assignments.length > 5 && (
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border-2 border-white text-[10px] font-bold">
                                  +{assignments.length - 5}
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-slate-600 ml-2">{completionRate}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditStudent(s)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteStudent(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">Chưa có học sinh nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "teachers" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Danh sách giáo viên</h2>
            <button onClick={() => setIsAddingTeacher(true)} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors">
              <Plus className="w-5 h-5" /> Thêm giáo viên
            </button>
          </div>

          {isAddingTeacher && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">{editingTeacher ? "Chỉnh sửa giáo viên" : "Thêm giáo viên mới"}</h3>
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập</label>
                    <input type="text" value={newTeacher.username} onChange={e => setNewTeacher({...newTeacher, username: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                    <input type="text" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                    <input type="text" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh đại diện (URL)</label>
                    <input type="url" value={newTeacher.avatarUrl} onChange={e => setNewTeacher({...newTeacher, avatarUrl: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="https://..." />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2 mt-2">
                    <input type="checkbox" id="isAdmin" checked={newTeacher.isAdmin} onChange={e => setNewTeacher({...newTeacher, isAdmin: e.target.checked})} className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500" />
                    <label htmlFor="isAdmin" className="text-sm font-medium text-slate-700">Cấp quyền Admin (Quản trị viên)</label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => { setIsAddingTeacher(false); setEditingTeacher(null); setNewTeacher({ username: "", password: "", name: "", avatarUrl: "", isAdmin: false }); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Hủy</button>
                  <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-xl font-medium shadow-sm transition-colors">Lưu</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 font-semibold text-slate-600">Tên đăng nhập</th>
                    <th className="p-4 font-semibold text-slate-600">Họ và tên</th>
                    <th className="p-4 font-semibold text-slate-600">Vai trò</th>
                    <th className="p-4 font-semibold text-slate-600 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-800">
                        <div className="flex items-center gap-3">
                          {t.avatarUrl ? (
                            <img src={t.avatarUrl} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold text-xs">{t.name ? t.name.charAt(0) : 'GV'}</div>
                          )}
                          {t.id.startsWith('teacher-') ? t.email?.split('@')[0] || t.id : t.id}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{t.name}</td>
                      <td className="p-4 text-slate-600">
                        <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-lg text-xs font-medium">Giáo viên</span>
                        {t.isAdmin && <span className="ml-2 px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium">Admin</span>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEditTeacher(t)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteTeacher(t.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">Chưa có giáo viên nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Quản lý bài tập</h2>
            <button onClick={() => setIsCreating(true)} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors">
              <Plus className="w-5 h-5" /> Giao bài mới
            </button>
          </div>

          {isCreating && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">{editingAssignment ? "Chỉnh sửa bài tập" : "Giao bài tập mới"}</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề bài tập</label>
                  <input type="text" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung / Mô tả</label>
                  <textarea value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none min-h-[100px]" placeholder="Nhập nội dung bài tập..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh đính kèm bài tập (URL - Tuỳ chọn)</label>
                  <input type="url" value={newAssignment.imageUrl || ""} onChange={e => setNewAssignment({...newAssignment, imageUrl: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="https://..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại bài</label>
                    <select value={newAssignment.type} onChange={e => setNewAssignment({...newAssignment, type: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none">
                      <option value="quiz">Trắc nghiệm</option>
                      <option value="essay">Tự luận</option>
                      <option value="video">Video tương tác</option>
                      <option value="drawing">Vẽ tranh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hình thức chấm</label>
                    <select value={newAssignment.gradingType} onChange={e => setNewAssignment({...newAssignment, gradingType: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none">
                      <option value="level">Đánh giá mức độ (Hoàn thành tốt, ...)</option>
                      <option value="score">Chấm điểm số (Thi cuối kỳ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hạn nộp</label>
                    <input type="date" value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" required />
                  </div>
                </div>
                {newAssignment.type === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn Video (YouTube URL)</label>
                    <input type="url" value={newAssignment.videoUrl || ""} onChange={e => setNewAssignment({...newAssignment, videoUrl: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="https://www.youtube.com/watch?v=..." required />
                  </div>
                )}
                {(newAssignment.type === 'quiz' || newAssignment.type === 'video') && (
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-slate-700">Danh sách câu hỏi</label>
                      <button type="button" onClick={handleAddQuestion} className="text-sm bg-sky-100 text-sky-600 px-3 py-1 rounded-lg font-medium hover:bg-sky-200 transition-colors">+ Thêm câu hỏi</button>
                    </div>
                    {newAssignment.questions.map((q, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                        <button type="button" onClick={() => handleRemoveQuestion(i)} className="absolute top-2 right-2 text-rose-500 hover:bg-rose-100 p-1 rounded-md"><Trash2 className="w-4 h-4" /></button>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Nội dung câu hỏi {i + 1}</label>
                          <input type="text" value={q.q || ""} onChange={e => handleQuestionChange(i, 'q', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm" placeholder="Nhập câu hỏi..." required />
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Ảnh đính kèm (URL - Tuỳ chọn)</label>
                          <input type="url" value={q.imageUrl || ""} onChange={e => handleQuestionChange(i, 'imageUrl', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm" placeholder="https://..." />
                        </div>
                        {newAssignment.type === 'video' && (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Thời gian xuất hiện (giây)</label>
                            <input type="number" value={q.time || 0} onChange={e => handleQuestionChange(i, 'time', parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm" required />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {q.options?.map((opt: string, optIdx: number) => (
                            <div key={optIdx}>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Lựa chọn {optIdx + 1}</label>
                              <input type="text" value={opt || ""} onChange={e => handleQuestionChange(i, 'options', e.target.value, optIdx)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm" required />
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Đáp án đúng</label>
                          <select value={q.answer || ""} onChange={e => handleQuestionChange(i, 'answer', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm" required>
                            <option value="">Chọn đáp án đúng</option>
                            {q.options?.map((opt: string, optIdx: number) => (
                              opt && <option key={optIdx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => { setIsCreating(false); setEditingAssignment(null); setNewAssignment({ title: "", description: "", imageUrl: "", type: "essay", dueDate: "", videoUrl: "", gradingType: "level", questions: [] }); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Hủy</button>
                  <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-xl font-medium shadow-sm transition-colors">Lưu bài</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map(a => (
              <div key={a.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-3 rounded-xl ${a.type === 'essay' ? 'bg-amber-100 text-amber-600' : a.type === 'video' ? 'bg-rose-100 text-rose-600' : a.type === 'drawing' ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>
                    {a.type === 'essay' && <FileText className="w-6 h-6" />}
                    {a.type === 'video' && <Video className="w-6 h-6" />}
                    {a.type === 'drawing' && <PenTool className="w-6 h-6" />}
                    {a.type === 'quiz' && <CheckCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{a.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mb-2">Hạn: {a.dueDate}</p>
                    {a.description && <p className="text-sm text-slate-600 line-clamp-2">{a.description}</p>}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <span className="text-sm font-medium text-slate-600">Đã nộp: {submissions.filter(s => s.assignmentId === a.id).length}/{students.length}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditAssignment(a)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteAssignment(a.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Chấm bài tự luận</h2>
          <div className="grid gap-6">
            {submissions.filter(s => s.status === "submitted").map(sub => {
              const student = students.find(st => st.id === sub.studentId);
              return (
                <SubmissionCard key={sub.id} sub={sub} assignment={assignments.find(a => a.id === sub.assignmentId)} studentName={student?.name || sub.studentId} onGrade={handleGrade} suggestComment={suggestComment} />
              );
            })}
            {submissions.filter(s => s.status === "submitted").length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Tuyệt vời! Thầy/cô đã chấm xong tất cả bài tập.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Thống kê lớp học</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-4 bg-sky-100 text-sky-600 rounded-2xl"><Users className="w-8 h-8" /></div>
              <div>
                <p className="text-sm font-medium text-slate-500">Sĩ số</p>
                <p className="text-2xl font-bold text-slate-800">{students.length} <span className="text-sm font-normal text-slate-500">học sinh</span></p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><CheckCircle className="w-8 h-8" /></div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tỷ lệ nộp bài</p>
                <p className="text-2xl font-bold text-slate-800">
                  {assignments.length > 0 && students.length > 0 
                    ? Math.round((submissions.length / (assignments.length * students.length)) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl"><BarChart2 className="w-8 h-8" /></div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tỷ lệ Hoàn thành tốt</p>
                <p className="text-2xl font-bold text-slate-800">
                  {submissions.filter(s => s.status === "graded").length > 0
                    ? Math.round((submissions.filter(s => s.level === "Hoàn thành tốt" || (s.score !== undefined && s.score >= 8)).length / submissions.filter(s => s.status === "graded").length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Kết quả học tập theo môn</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Hoàn thành tốt" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Hoàn thành" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chưa hoàn thành" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "posts" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Bảng tin lớp học</h2>
            <button onClick={() => setIsCreatingPost(true)} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors">
              <Plus className="w-5 h-5" /> Đăng bài mới
            </button>
          </div>

          {isCreatingPost && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Đăng bài lên bảng tin</h3>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung bài đăng</label>
                  <textarea value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none min-h-[100px]" placeholder="Nhập nội dung thông báo..." required></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn hình ảnh (URL)</label>
                    <input type="url" value={newPost.imageUrl} onChange={e => setNewPost({...newPost, imageUrl: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn Video (YouTube URL)</label>
                    <input type="url" value={newPost.videoUrl} onChange={e => setNewPost({...newPost, videoUrl: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="https://www.youtube.com/watch?v=..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Đính kèm file (Hình ảnh, Excel, PDF, Word...)</label>
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer border border-slate-200 border-dashed">
                    <Paperclip className="w-5 h-5" /> Chọn file từ máy tính
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileUploadPost} />
                  </label>
                  {newPost.files && newPost.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {newPost.files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-sm text-slate-600 truncate max-w-[80%]">{file.name}</span>
                          <button type="button" onClick={() => removeFile(idx)} className="text-rose-500 hover:bg-rose-100 p-1 rounded-md"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => { setIsCreatingPost(false); setEditingPost(null); setNewPost({ content: "", imageUrl: "", videoUrl: "", files: [] }); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Hủy</button>
                  <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-xl font-medium shadow-sm transition-colors">{editingPost ? "Cập nhật" : "Đăng bài"}</button>
                </div>
              </form>
            </div>
          )}

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
                  <div className="flex gap-2">
                    <button onClick={() => handleEditPost(post)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeletePost(post.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
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
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Cài đặt ứng dụng</h2>
            {!isEditingSettings && (
              <button onClick={() => setIsEditingSettings(true)} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors">
                <Edit className="w-5 h-5" /> Chỉnh sửa
              </button>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            {isEditingSettings ? (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên ứng dụng</label>
                    <input type="text" value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Lớp Học Đảo Ngược" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên giáo viên</label>
                    <input type="text" value={settingsForm.teacherName} onChange={e => setSettingsForm({...settingsForm, teacherName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Cô giáo" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên trường</label>
                    <input type="text" value={settingsForm.schoolName} onChange={e => setSettingsForm({...settingsForm, schoolName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Trường Tiểu học ABC" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên lớp</label>
                    <input type="text" value={settingsForm.className} onChange={e => setSettingsForm({...settingsForm, className: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Lớp 3A" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn ảnh đại diện (URL)</label>
                    <input type="url" value={settingsForm.avatarUrl} onChange={e => setSettingsForm({...settingsForm, avatarUrl: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="https://..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsEditingSettings(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Hủy</button>
                  <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-xl font-medium shadow-sm transition-colors">Lưu thay đổi</button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  {appSettings.avatarUrl ? (
                    <img src={appSettings.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold text-3xl shadow-sm border-4 border-slate-50">GV</div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{appSettings.teacherName || "Cô giáo"}</h3>
                    <p className="text-slate-500 font-medium">Giáo viên chủ nhiệm</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Tên ứng dụng</p>
                    <p className="font-medium text-slate-800">{appSettings.appName || "Lớp Học Đảo Ngược"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Trường học</p>
                    <p className="font-medium text-slate-800">{appSettings.schoolName || "Trường Tiểu học ABC"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Lớp học</p>
                    <p className="font-medium text-slate-800">{appSettings.className || "Lớp 3A"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Đổi thông tin đăng nhập</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const newUsername = (form.elements.namedItem('newUsername') as HTMLInputElement).value;
              const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
              const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
              
              if (newPassword && newPassword !== confirmPassword) {
                alert("Mật khẩu xác nhận không khớp!");
                return;
              }
              
              const currentTeacher = teachers.find(t => t.id === user?.id);
              if (currentTeacher) {
                try {
                  const updates: any = {};
                  if (newUsername) {
                    updates.id = newUsername;
                    updates.email = `${newUsername}@school.com`;
                  }
                  if (newPassword) updates.password = newPassword;
                  
                  await updateTeacher(currentTeacher.id, updates);
                  alert("Đổi thông tin thành công! Vui lòng đăng nhập lại.");
                  form.reset();
                } catch (error: any) {
                  alert("Lỗi: " + error.message);
                }
              } else {
                alert("Không tìm thấy thông tin tài khoản!");
              }
            }} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập mới (để trống nếu không đổi)</label>
                <input type="text" name="newUsername" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới (để trống nếu không đổi)</label>
                <input type="password" name="newPassword" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <input type="password" name="confirmPassword" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-xl font-medium shadow-sm transition-colors w-full">Cập nhật</button>
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

  const hasImages = typeof sub.content === 'object' && sub.content !== null && Array.isArray(sub.content.images);
  const images = hasImages ? sub.content.images : [];
  
  // Extract main content based on assignment type
  let mainContent = sub.content;
  if (typeof sub.content === 'object' && sub.content !== null) {
    if (assignment?.type === 'essay' || assignment?.type === 'drawing') {
      mainContent = sub.content.text || sub.content;
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800">{assignment?.title || "Bài tập"}</h3>
          <p className="text-sm text-slate-500 font-medium">Học sinh: {studentName} • Nộp lúc: {new Date(sub.submittedAt).toLocaleDateString("vi-VN")}</p>
        </div>
      </div>
      <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
        {assignment?.type === 'drawing' ? (
          <img src={typeof mainContent === 'string' ? mainContent : ''} alt="Bài vẽ của học sinh" className="max-w-full h-auto rounded-xl border border-slate-200" />
        ) : (assignment?.type === 'quiz' || assignment?.type === 'video') ? (
          <div className="space-y-4">
            {assignment.questions?.map((q: any, i: number) => {
              const studentAnswer = typeof sub.content === 'object' ? sub.content[i] : undefined;
              const isCorrect = studentAnswer === q.answer;
              return (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800 mb-2">Câu {i + 1}: {q.q}</p>
                  {q.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-100">
                      <img src={q.imageUrl} alt="Question image" className="w-full h-auto max-h-[150px] object-contain bg-slate-50" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <p className="text-sm text-slate-600 mb-1">
                    <span className="font-medium">Học sinh chọn:</span>{' '}
                    <span className={isCorrect ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                      {studentAnswer || "Chưa trả lời"}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Đáp án đúng:</span> <span className="text-emerald-600 font-bold">{q.answer}</span>
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-700 whitespace-pre-wrap">{typeof mainContent === 'string' ? mainContent : JSON.stringify(mainContent)}</p>
        )}
        
        {images.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-700 mb-3">Ảnh đính kèm:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img: string, idx: number) => (
                <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block border border-slate-200 rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
                  <img src={img} alt={`Đính kèm ${idx + 1}`} className="w-full h-auto object-cover aspect-square" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={handleSuggest} disabled={loadingAI} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
            <Sparkles className="w-4 h-4" /> {loadingAI ? "AI đang phân tích..." : "AI Gợi ý nhận xét"}
          </button>
        </div>
        
        <textarea 
          value={comment} 
          onChange={e => setComment(e.target.value)} 
          placeholder="Nhập nhận xét của giáo viên..." 
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none min-h-[100px]"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {assignment?.gradingType === 'score' ? (
              <div className="flex items-center gap-2">
                <label className="font-medium text-slate-700">Điểm số:</label>
                <input 
                  type="number" 
                  min="0" 
                  max="10" 
                  step="0.5"
                  value={score} 
                  onChange={e => setScore(e.target.value ? Number(e.target.value) : "")} 
                  className="w-20 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none text-center font-bold text-lg"
                  placeholder="0-10"
                />
              </div>
            ) : (
              ["Hoàn thành tốt", "Hoàn thành", "Chưa hoàn thành"].map(l => (
                <label key={l} className={`cursor-pointer px-4 py-2 rounded-xl border-2 font-medium transition-colors ${level === l ? (l === 'Hoàn thành tốt' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : l === 'Hoàn thành' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-rose-500 bg-rose-50 text-rose-700') : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                  <input type="radio" name="level" value={l} checked={level === l} onChange={() => setLevel(l)} className="hidden" />
                  {l}
                </label>
              ))
            )}
          </div>
          <button onClick={() => onGrade(sub.id, { comment, level: assignment?.gradingType === 'score' ? undefined : level, score: assignment?.gradingType === 'score' ? score : undefined })} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold shadow-sm transition-colors">
            Lưu đánh giá
          </button>
        </div>
      </div>
    </div>
  );
}
