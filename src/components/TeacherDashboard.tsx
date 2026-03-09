import React, { useState, useEffect } from "react";
import { subscribeToAssignments, subscribeToSubmissions, createAssignment, gradeSubmission, subscribeToStudents, addStudent, updateAssignment, deleteAssignment, resetApp, updateStudent, deleteStudent, undoLastAction, subscribeToPosts, createPost, deletePost, updatePost, subscribeToAppSettings, updateAppSettings, subscribeToTeachers, addTeacher, updateTeacher, deleteTeacher, updateSubmission } from "../firebase/db";
import { updateUserPassword, updateUserEmail, logout } from "../firebase/auth";
import { Plus, FileText, Video, PenTool, CheckCircle, Sparkles, BarChart2, Users, Edit, Trash2, Upload, Download, Undo2, Image as ImageIcon, Paperclip, Settings, X, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import AttachmentManager, { Attachment } from "./AttachmentManager";
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
  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", imageUrl: "", type: "essay", dueDate: "", videoUrl: "", gradingType: "level", questions: [] as any[], attachments: [] as Attachment[] });
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
  const [filterId, setFilterId] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterProgress, setFilterProgress] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [selectedChartData, setSelectedChartData] = useState<{ assignmentName: string, category: string, students: any[] } | null>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<string | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "pending" | "submitted" | "graded">("all");
  const [submissionFilter, setSubmissionFilter] = useState("pending");

  useEffect(() => {
    console.log("TeacherDashboard - Current User:", user);
    console.log("TeacherDashboard - Teachers List:", teachers);
  }, [user, teachers]);

  useEffect(() => {
    const unsubAssignments = subscribeToAssignments(setAssignments);
    const unsubSubmissions = subscribeToSubmissions(setSubmissions);
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubTeachers = subscribeToTeachers(setTeachers);
    const unsubPosts = subscribeToPosts(setPosts);
    const unsubSettings = subscribeToAppSettings((set) => {
      setAppSettings(set);
      setSettingsForm({
        teacherName: set.teacherName || "",
        schoolName: set.schoolName || "",
        className: set.className || "",
        avatarUrl: set.avatarUrl || "",
        appName: set.appName || ""
      });
    });

    return () => {
      unsubAssignments();
      unsubSubmissions();
      unsubStudents();
      unsubTeachers();
      unsubPosts();
      unsubSettings();
    };
  }, []);

  const handleUndo = () => {
    undoLastAction();
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
      setNewAssignment({ title: "", description: "", imageUrl: "", type: "essay", dueDate: "", videoUrl: "", gradingType: "level", questions: [], attachments: [] });
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài tập này? Tất cả bài làm và điểm thưởng của học sinh liên quan cũng sẽ bị xóa.")) return;
    await deleteAssignment(id);
  };

  const handleResetApp = async () => {
    if (!confirm("CẢNH BÁO: Bạn đang thực hiện reset cho năm học mới. Hành động này sẽ xóa TẤT CẢ bài tập, bài làm, huy hiệu và bài viết trên bảng tin. Bạn có chắc chắn muốn tiếp tục?")) return;
    try {
      await resetApp();
      alert("Đã reset dữ liệu thành công cho năm học mới!");
    } catch (error: any) {
      alert("Lỗi khi reset: " + error.message);
    }
  };

  const handleEditAssignment = (a: any) => {
    setEditingAssignment(a);
    setNewAssignment({ title: a.title || "", description: a.description || "", imageUrl: a.imageUrl || "", type: a.type || "essay", dueDate: a.dueDate || "", videoUrl: a.videoUrl || "", gradingType: a.gradingType || "level", questions: a.questions || [], attachments: a.attachments || [] });
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
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudent(id);
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
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    await deleteTeacher(id);
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
    try {
      await gradeSubmission(subId, data);
    } catch (error) {
      console.error("Error grading submission:", error);
      alert("Có lỗi xảy ra khi chấm bài. Vui lòng thử lại.");
    }
  };

  const handleApproveRedo = async (subId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn cho phép học sinh làm lại bài này?")) {
      await updateSubmission(subId, { status: "redo_approved" });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAppSettings(settingsForm);
    setIsEditingSettings(false);
  };

  const suggestComment = async (content: string, studentName: string, assignment: any) => {
    try {
      const res = await fetch("/api/ai/suggest-comment", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ content, studentName, assignment }) 
      });
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

  const getStudentMetrics = (studentId: string) => {
    const total = assignments.length;
    // Only count submissions that belong to assignments that currently exist
    const studentSubs = submissions.filter(s => 
      s.studentId === studentId && 
      assignments.some(a => a.id === s.assignmentId)
    );
    const submitted = studentSubs.length;
    const percentage = total === 0 ? 0 : Math.round((submitted / total) * 100);
    
    let emojis = "";
    let good = 0, ok = 0, bad = 0;
    
    if (total > 0) {
      assignments.forEach(a => {
        const sub = studentSubs.find(s => s.assignmentId === a.id);
        if (!sub) {
          emojis += "❌ ";
        } else if (sub.status === "graded") {
          if (sub.level === "Hoàn thành tốt" || sub.score >= 8) {
            emojis += "🌟 ";
            good++;
          } else if (sub.level === "Hoàn thành" || (sub.score >= 5 && sub.score < 8)) {
            emojis += "👍 ";
            ok++;
          } else {
            emojis += "⚠️ ";
            bad++;
          }
        } else {
          emojis += "⏳ ";
        }
      });
    }
    
    let overallResult = "";
    if (total > 0) {
      if (good > ok && good > bad) overallResult = "Tốt";
      else if (bad > good && bad > ok) overallResult = "Chưa đạt";
      else if (submitted > 0) overallResult = "Đạt";
    }

    return { total, submitted, percentage, emojis, overallResult };
  };

  const handleChartClick = (data: any, category: string) => {
    const assignment = assignments.find(a => a.title.substring(0, 10) === data.name);
    if (!assignment) return;

    const subs = submissions.filter(s => s.assignmentId === assignment.id && s.status === "graded");
    let filteredSubs: any[] = [];
    if (category === "Tốt") {
      filteredSubs = subs.filter(s => s.level === "Hoàn thành tốt" || (s.score >= 8));
    } else if (category === "Đạt") {
      filteredSubs = subs.filter(s => s.level === "Hoàn thành" || (s.score >= 5 && s.score < 8));
    } else if (category === "Chưa đạt") {
      filteredSubs = subs.filter(s => s.level === "Chưa hoàn thành" || (s.score < 5));
    }

    const studentList = filteredSubs.map(sub => {
      const st = students.find(s => s.id === sub.studentId);
      return { id: sub.studentId, name: st ? st.name : sub.studentId };
    });

    setSelectedChartData({
      assignmentName: assignment.title,
      category,
      students: studentList
    });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Desktop Tabs */}
      <div className="hidden md:flex gap-4 border-b border-slate-200 pb-2 overflow-x-auto justify-between items-center">
        <div className="flex gap-4">
          <button onClick={() => setActiveTab("students")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "students" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Học sinh</button>
          {user?.isAdmin && <button onClick={() => setActiveTab("teachers")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "teachers" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Giáo viên</button>}
          <button onClick={() => setActiveTab("assignments")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "assignments" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Bài tập</button>
          <button onClick={() => setActiveTab("submissions")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "submissions" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Chấm bài</button>
          <button onClick={() => setActiveTab("analytics")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "analytics" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Thống kê</button>
          <button onClick={() => setActiveTab("posts")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "posts" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Bảng tin</button>
          <button onClick={() => setActiveTab("settings")} className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "settings" ? "text-sky-600 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"}`}>Cài đặt</button>
        </div>
        <button onClick={handleUndo} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          <Undo2 className="w-4 h-4" /> Hoàn tác
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 px-2 py-2 flex justify-around items-center overflow-x-auto">
        <button onClick={() => setActiveTab("students")} className={`flex flex-col items-center min-w-[64px] p-2 rounded-xl transition-colors ${activeTab === "students" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:bg-slate-50"}`}>
          <Users className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Học sinh</span>
        </button>
        {user?.isAdmin && (
          <button onClick={() => setActiveTab("teachers")} className={`flex flex-col items-center min-w-[64px] p-2 rounded-xl transition-colors ${activeTab === "teachers" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:bg-slate-50"}`}>
            <Users className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Giáo viên</span>
          </button>
        )}
        <button onClick={() => setActiveTab("assignments")} className={`flex flex-col items-center min-w-[64px] p-2 rounded-xl transition-colors ${activeTab === "assignments" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:bg-slate-50"}`}>
          <FileText className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Bài tập</span>
        </button>
        <button onClick={() => setActiveTab("submissions")} className={`flex flex-col items-center min-w-[64px] p-2 rounded-xl transition-colors ${activeTab === "submissions" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:bg-slate-50"}`}>
          <CheckCircle className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Chấm bài</span>
        </button>
        <button onClick={() => setActiveTab("analytics")} className={`flex flex-col items-center min-w-[64px] p-2 rounded-xl transition-colors ${activeTab === "analytics" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:bg-slate-50"}`}>
          <BarChart2 className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Thống kê</span>
        </button>
        <button onClick={() => setActiveTab("posts")} className={`flex flex-col items-center min-w-[64px] p-2 rounded-xl transition-colors ${activeTab === "posts" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:bg-slate-50"}`}>
          <PenTool className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Bảng tin</span>
        </button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center min-w-[64px] p-2 rounded-xl transition-colors ${activeTab === "settings" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:bg-slate-50"}`}>
          <Settings className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Cài đặt</span>
        </button>
      </div>

      {/* Mobile Header Actions (Undo) */}
      <div className="md:hidden flex justify-end mb-4">
        <button onClick={handleUndo} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-xl transition-colors">
          <Undo2 className="w-4 h-4" /> Hoàn tác
        </button>
      </div>

      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Danh sách học sinh</h2>
            <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
              <input type="text" placeholder="Tìm kiếm..." value={studentSearchTerm} onChange={(e) => setStudentSearchTerm(e.target.value)} className="w-full md:w-auto px-4 py-2 rounded-xl border border-slate-200 outline-none" />
              <button onClick={exportResults} className="flex-1 md:flex-none justify-center bg-indigo-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Download className="w-5 h-5" /> <span className="hidden sm:inline">Xuất Excel</span></button>
              <button onClick={downloadStudentTemplate} className="flex-1 md:flex-none justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Download className="w-5 h-5" /> <span className="hidden sm:inline">Tải mẫu</span></button>
              <label className="flex-1 md:flex-none justify-center bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors cursor-pointer"><Upload className="w-5 h-5" /> <span className="hidden sm:inline">Nhập Excel</span><input type="file" className="hidden" onChange={handleFileUpload} /></label>
              <button onClick={() => setIsAddingStudent(true)} className="flex-1 md:flex-none justify-center bg-sky-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" /> <span className="hidden sm:inline">Thêm</span></button>
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

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold text-slate-600">Mã số</th>
                  <th className="p-4 font-semibold text-slate-600">Họ tên</th>
                  <th className="p-4 font-semibold text-slate-600">Giới tính</th>
                  <th className="p-4 font-semibold text-slate-600">Tiến độ</th>
                  <th className="p-4 font-semibold text-slate-600">Kết quả</th>
                  <th className="p-4 font-semibold text-slate-600 text-right">Thao tác</th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 pb-3"><input type="text" placeholder="Lọc mã..." className="w-full px-2 py-1 text-sm rounded border outline-none font-normal" value={filterId} onChange={e => setFilterId(e.target.value)} /></th>
                  <th className="px-4 pb-3"><input type="text" placeholder="Lọc tên..." className="w-full px-2 py-1 text-sm rounded border outline-none font-normal" value={filterName} onChange={e => setFilterName(e.target.value)} /></th>
                  <th className="px-4 pb-3">
                    <select className="w-full px-2 py-1 text-sm rounded border outline-none font-normal" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                      <option value="">Tất cả</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </th>
                  <th className="px-4 pb-3">
                    <select className="w-full px-2 py-1 text-sm rounded border outline-none font-normal" value={filterProgress} onChange={e => setFilterProgress(e.target.value)}>
                      <option value="">Tất cả</option>
                      <option value="100">Hoàn thành 100%</option>
                      <option value=">0">Đang làm</option>
                      <option value="0">Chưa làm</option>
                    </select>
                  </th>
                  <th className="px-4 pb-3">
                    <select className="w-full px-2 py-1 text-sm rounded border outline-none font-normal" value={filterResult} onChange={e => setFilterResult(e.target.value)}>
                      <option value="">Tất cả</option>
                      <option value="Tốt">Tốt</option>
                      <option value="Đạt">Đạt</option>
                      <option value="Chưa đạt">Chưa đạt</option>
                    </select>
                  </th>
                  <th className="px-4 pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {students.filter(s => {
                  const metrics = getStudentMetrics(s.id);
                  const matchId = s.id.toLowerCase().includes(filterId.toLowerCase());
                  const matchName = s.name.toLowerCase().includes(filterName.toLowerCase());
                  const matchGender = filterGender ? s.gender === filterGender : true;
                  const matchProgress = filterProgress === "100" ? metrics.percentage === 100 : filterProgress === ">0" ? (metrics.percentage > 0 && metrics.percentage < 100) : filterProgress === "0" ? metrics.percentage === 0 : true;
                  const matchResult = filterResult ? metrics.overallResult === filterResult : true;
                  const matchSearch = s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) || s.id.toLowerCase().includes(studentSearchTerm.toLowerCase());
                  return matchId && matchName && matchGender && matchProgress && matchResult && matchSearch;
                }).map(s => {
                  const metrics = getStudentMetrics(s.id);
                  return (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{s.id}</td>
                    <td className="p-4 text-slate-600">{s.name}</td>
                    <td className="p-4 text-slate-600">{s.gender}</td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{metrics.submitted}/{metrics.total} ({metrics.percentage}%)</span>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500" style={{ width: `${metrics.percentage}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-lg tracking-widest">{metrics.emojis}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditStudent(s)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteStudent(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )})}
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

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Bài tập</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setAssignmentFilter("all")} 
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${assignmentFilter === "all" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Tất cả
                </button>
                <button 
                  onClick={() => setAssignmentFilter("pending")} 
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${assignmentFilter === "pending" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Chưa nộp
                </button>
                <button 
                  onClick={() => setAssignmentFilter("submitted")} 
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${assignmentFilter === "submitted" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Đã nộp
                </button>
                <button 
                  onClick={() => setAssignmentFilter("graded")} 
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${assignmentFilter === "graded" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Đã chấm
                </button>
              </div>
              <button onClick={() => setIsCreating(true)} className="bg-sky-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" /> Giao bài</button>
            </div>
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
                  </select>
                  <select value={newAssignment.gradingType} onChange={e => setNewAssignment({...newAssignment, gradingType: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none">
                    <option value="level">Mức độ</option>
                    <option value="score">Điểm số</option>
                  </select>
                  <input type="date" value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} className="px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                </div>
                {newAssignment.type === 'video' && (
                  <div className="space-y-4">
                    <input type="url" placeholder="Đường dẫn Video (Youtube, v.v.)" value={newAssignment.videoUrl} onChange={e => setNewAssignment({...newAssignment, videoUrl: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" required />
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-slate-700">Câu hỏi tương tác trong Video</h4>
                        <button type="button" onClick={handleAddQuestion} className="text-sky-600 font-medium">+ Thêm câu hỏi</button>
                      </div>
                      {newAssignment.questions.map((q, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 relative">
                          <button type="button" onClick={() => handleRemoveQuestion(i)} className="absolute top-2 right-2 text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Thời gian xuất hiện (HH:MM:SS)</label>
                            <input 
                              type="text" 
                              placeholder="Ví dụ: 00:05:10 (5 phút 10 giây)" 
                              value={
                                (() => {
                                  const totalSeconds = q.time || 0;
                                  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
                                  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
                                  const s = (totalSeconds % 60).toString().padStart(2, '0');
                                  return `${h}:${m}:${s}`;
                                })()
                              } 
                              onChange={e => {
                                const val = e.target.value;
                                const parts = val.split(':');
                                let seconds = 0;
                                if (parts.length === 3) {
                                  seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                                } else if (parts.length === 2) {
                                  seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                                } else if (parts.length === 1) {
                                  seconds = parseInt(parts[0]);
                                }
                                handleQuestionChange(i, 'time', isNaN(seconds) ? 0 : seconds);
                              }} 
                              className="w-full px-3 py-2 rounded-lg border border-slate-200" 
                              required 
                            />
                          </div>
                          <input type="text" placeholder="Nội dung câu hỏi" value={q.q} onChange={e => handleQuestionChange(i, 'q', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 mb-2" required />
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt: string, optIdx: number) => (
                              <input key={optIdx} type="text" placeholder={`Lựa chọn ${optIdx + 1}`} value={opt} onChange={e => handleQuestionChange(i, 'options', e.target.value, optIdx)} className="px-3 py-2 rounded-lg border border-slate-200" required />
                            ))}
                          </div>
                          <select value={q.answer} onChange={e => handleQuestionChange(i, 'answer', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-2" required>
                            <option value="">Chọn đáp án đúng</option>
                            {q.options.map((opt: string) => opt && <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                <AttachmentManager attachments={newAssignment.attachments} onChange={attachments => setNewAssignment({...newAssignment, attachments})} />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsCreating(false); setEditingAssignment(null); }} className="px-4 py-2 text-slate-600">Hủy</button>
                  <button type="submit" className="bg-sky-500 text-white px-6 py-2 rounded-xl">Lưu</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.filter(a => {
              if (assignmentFilter === "all") return true;
              const assignmentSubmissions = submissions.filter(s => s.assignmentId === a.id);
              if (assignmentFilter === "pending") {
                return assignmentSubmissions.length === 0;
              }
              if (assignmentFilter === "submitted") {
                return assignmentSubmissions.length > 0 && assignmentSubmissions.some(s => s.status !== "graded");
              }
              if (assignmentFilter === "graded") {
                return assignmentSubmissions.length > 0 && assignmentSubmissions.every(s => s.status === "graded");
              }
              return true;
            }).map(a => (
              <div key={a.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800">{a.title}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">Hạn: {a.dueDate}</p>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{a.description}</p>
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
          {assignments.filter(a => {
            if (assignmentFilter === "all") return true;
            const assignmentSubmissions = submissions.filter(s => s.assignmentId === a.id);
            if (assignmentFilter === "pending") return assignmentSubmissions.length === 0;
            if (assignmentFilter === "submitted") return assignmentSubmissions.length > 0 && assignmentSubmissions.some(s => s.status !== "graded");
            if (assignmentFilter === "graded") return assignmentSubmissions.length > 0 && assignmentSubmissions.every(s => s.status === "graded");
            return true;
          }).length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Không có bài tập nào phù hợp với bộ lọc.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Chấm bài</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setSubmissionFilter("pending")} 
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${submissionFilter === "pending" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Chưa chấm ({submissions.filter(s => s.status === "submitted" || s.status === "redo_requested").length})
              </button>
              <button 
                onClick={() => setSubmissionFilter("graded")} 
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${submissionFilter === "graded" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Đã chấm ({submissions.filter(s => s.status === "graded").length})
              </button>
            </div>
          </div>
          <div className="grid gap-6">
            {submissions.filter(s => submissionFilter === "pending" ? (s.status === "submitted" || s.status === "redo_requested") : s.status === "graded").map(sub => {
              const student = students.find(st => st.id === sub.studentId);
              const assignment = assignments.find(a => a.id === sub.assignmentId);
              return (
                <SubmissionCard key={sub.id} sub={sub} assignment={assignment} studentName={student?.name || sub.studentId} onGrade={handleGrade} suggestComment={suggestComment} onApproveRedo={handleApproveRedo} />
              );
            })}
            {submissions.filter(s => submissionFilter === "pending" ? (s.status === "submitted" || s.status === "redo_requested") : s.status === "graded").length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                {submissionFilter === "pending" ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Đã chấm xong tất cả bài tập.</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Chưa có bài tập nào được chấm.</p>
                  </>
                )}
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
                {(() => {
                  const validSubmissions = submissions.filter(s => assignments.some(a => a.id === s.assignmentId));
                  return assignments.length > 0 && students.length > 0 
                    ? Math.round((validSubmissions.length / (assignments.length * students.length)) * 100) 
                    : 0;
                })()}%
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
                <Bar dataKey="Tốt" fill="#10b981" onClick={(data) => handleChartClick(data, 'Tốt')} cursor="pointer" />
                <Bar dataKey="Đạt" fill="#3b82f6" onClick={(data) => handleChartClick(data, 'Đạt')} cursor="pointer" />
                <Bar dataKey="Chưa đạt" fill="#f43f5e" onClick={(data) => handleChartClick(data, 'Chưa đạt')} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {selectedChartData && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  Học sinh đạt mức <span className={selectedChartData.category === 'Tốt' ? 'text-emerald-500' : selectedChartData.category === 'Đạt' ? 'text-blue-500' : 'text-rose-500'}>{selectedChartData.category}</span> - {selectedChartData.assignmentName}
                </h3>
                <button onClick={() => setSelectedChartData(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              {selectedChartData.students.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedChartData.students.map((student, idx) => (
                    <li key={idx} className="bg-slate-50 px-4 py-2 rounded-xl text-slate-700 flex items-center justify-between font-medium">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedChartData.category === 'Tốt' ? 'bg-emerald-500' : selectedChartData.category === 'Đạt' ? 'bg-blue-500' : 'bg-rose-500'}`}></div>
                        {student.name}
                      </div>
                      <button 
                        onClick={() => setSelectedStudentDetails(student.id)}
                        className="text-xs bg-sky-100 text-sky-600 px-2 py-1 rounded-lg hover:bg-sky-200 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">Không có học sinh nào trong nhóm này.</p>
              )}
            </div>
          )}
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <label className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-medium cursor-pointer flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Paperclip className="w-5 h-5" /> Đính kèm file
                    <input type="file" multiple className="hidden" onChange={handleFileUploadPost} />
                  </label>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button type="button" onClick={() => { setIsCreatingPost(false); setEditingPost(null); }} className="flex-1 sm:flex-none px-4 py-2 text-slate-600 bg-slate-100 sm:bg-transparent rounded-xl sm:rounded-none">Hủy</button>
                    <button type="submit" className="flex-1 sm:flex-none bg-sky-500 text-white px-6 py-2 rounded-xl">Đăng</button>
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
                    <button onClick={async () => { await deletePost(post.id); }} className="p-2 text-rose-500"><Trash2 className="w-4 h-4" /></button>
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
              console.log("Form submitted");
              const form = e.target as HTMLFormElement;
              const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
              const originalText = submitBtn.innerText;
              
              const newUsername = (form.elements.namedItem('newUsername') as HTMLInputElement).value.trim();
              const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
              const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
              
              console.log("Data:", { newUsername, hasPassword: !!newPassword });

              if (newPassword && newPassword !== confirmPassword) { 
                alert("Mật khẩu xác nhận không khớp!"); 
                return; 
              }

              if (!newUsername && !newPassword) {
                alert("Vui lòng nhập tên đăng nhập mới hoặc mật khẩu mới!");
                return;
              }

              try {
                submitBtn.disabled = true;
                submitBtn.innerText = "Đang xử lý...";

                console.log("Current user from AuthContext:", user);

                // Ưu tiên dùng thông tin từ user context nếu có đủ id và email
                let currentTeacherId = user?.id || user?.uid;
                let currentTeacherEmail = user?.email;

                // Nếu không có id trong user context, tìm trong danh sách teachers
                if (!currentTeacherId || currentTeacherId === user?.uid) {
                  const found = teachers.find(t => 
                    t.email?.toLowerCase() === user?.email?.toLowerCase() ||
                    t.id?.toLowerCase() === user?.email?.split('@')[0]?.toLowerCase()
                  );
                  if (found) {
                    currentTeacherId = found.id;
                    currentTeacherEmail = found.email;
                  }
                }
                
                if (!currentTeacherId) {
                  console.error("Teacher ID not found. User object:", user);
                  alert("Không tìm thấy mã định danh giáo viên của bạn. Vui lòng thử Đăng xuất và Đăng nhập lại để đồng bộ dữ liệu.");
                  return;
                }

                console.log("Updating teacher with ID:", currentTeacherId);

                const updates: any = {};
                const newEmail = newUsername ? `${newUsername.toLowerCase()}@school.com` : currentTeacherEmail;
                
                if (newUsername) { 
                  updates.id = newUsername.toLowerCase(); 
                  updates.email = newEmail; 
                }
                if (newPassword) updates.password = newPassword;
                
                console.log("Applying updates to DB:", updates);
                // 1. Cập nhật Cơ sở dữ liệu
                await updateTeacher(currentTeacherId, updates);
                console.log("DB update success");
                
                // 2. Đồng bộ với hệ thống đăng nhập
                try {
                  if (newPassword) {
                    console.log("Updating Auth password...");
                    await updateUserPassword(newPassword);
                  }
                  if (newUsername && newEmail !== currentTeacherEmail) {
                    console.log("Updating Auth email...");
                    await updateUserEmail(newEmail);
                  }
                  
                  alert("Cập nhật thành công! Hệ thống sẽ tự động đăng xuất để bạn đăng nhập lại với thông tin mới.");
                  await logout();
                  window.location.href = "/login";
                } catch (authError: any) {
                  console.error("Auth sync failed:", authError);
                  if (authError.code === 'auth/operation-not-allowed') {
                    alert("Đã lưu vào Cơ sở dữ liệu, nhưng hệ thống đăng nhập (Firebase) chưa cho phép đổi tên đăng nhập.\n\nCÁCH KHẮC PHỤC:\n1. Vào Firebase Console -> Authentication -> Settings.\n2. Bật (Enable) mục 'Email address change' trong phần 'User actions'.\n3. Thử lại sau khi đã bật.");
                  } else {
                    alert("Đã lưu mật khẩu mới vào Cơ sở dữ liệu. Tuy nhiên, do yêu cầu bảo mật của Google, bạn cần Đăng xuất và Đăng nhập lại NGAY LẬP TỨC để mật khẩu mới có hiệu lực trên hệ thống đăng nhập. (Lỗi: " + authError.message + ")");
                  }
                }
              } catch (error: any) {
                console.error("Update failed:", error);
                alert("Lỗi khi cập nhật: " + error.message);
              } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
              }
            }} className="space-y-4 max-w-md">
              <input type="text" name="newUsername" placeholder="Tên đăng nhập mới (để trống nếu không đổi)" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" />
              <input type="password" name="newPassword" placeholder="Mật khẩu mới (để trống nếu không đổi)" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" />
              <input type="password" name="confirmPassword" placeholder="Xác nhận mật khẩu mới" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" />
              <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-xl w-full disabled:opacity-50">Cập nhật</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-4 text-rose-600">Khu vực nguy hiểm</h3>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-sm text-rose-800 mb-4">
                <strong>Reset cho năm học mới:</strong> Hành động này sẽ xóa toàn bộ bài tập, bài làm, huy hiệu và bài viết. Danh sách học sinh và giáo viên sẽ được giữ lại nhưng số lượt quay đã dùng của học sinh sẽ được reset về 0.
              </p>
              <button 
                onClick={handleResetApp}
                className="bg-rose-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-rose-600 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Reset dữ liệu năm học mới
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStudentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedStudentDetails(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10 rounded-t-3xl">
              <h2 className="text-2xl font-bold text-slate-800">
                Chi tiết tiến độ: {students.find(s => s.id === selectedStudentDetails)?.name}
              </h2>
              <button onClick={() => setSelectedStudentDetails(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {assignments.length > 0 ? assignments.map(assignment => {
                const sub = submissions.find(s => s.assignmentId === assignment.id && s.studentId === selectedStudentDetails);
                return (
                  <div key={assignment.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 text-lg">{assignment.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        !sub ? 'bg-slate-200 text-slate-600' : 
                        sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {!sub ? 'Chưa nộp' : sub.status === 'graded' ? 'Đã chấm' : 'Đã nộp'}
                      </span>
                    </div>
                    {sub && sub.status === 'graded' && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 font-medium mb-1">Đánh giá</p>
                          <p className={`font-bold ${
                            sub.level === 'Hoàn thành tốt' || sub.score >= 8 ? 'text-emerald-600' :
                            sub.level === 'Hoàn thành' || (sub.score >= 5 && sub.score < 8) ? 'text-blue-600' :
                            'text-rose-600'
                          }`}>{sub.level || (sub.score >= 8 ? 'Hoàn thành tốt' : sub.score >= 5 ? 'Hoàn thành' : 'Chưa hoàn thành')}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-500 font-medium mb-1">Điểm / Sao</p>
                          <p className="font-bold text-slate-800">{sub.score} điểm • {sub.stars || 0} 🌟</p>
                        </div>
                        {sub.comment && (
                          <div className="col-span-2 bg-white p-3 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 font-medium mb-1">Nhận xét</p>
                            <p className="text-slate-700 text-sm">{sub.comment}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }) : (
                <p className="text-slate-500 text-center py-8">Chưa có bài tập nào được giao.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ sub, assignment, studentName, onGrade, suggestComment, onApproveRedo }: any) {
  const [isGrading, setIsGrading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [gradeData, setGradeData] = useState({ level: "Hoàn thành", score: 10, comment: "", stars: 0 });
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (sub.status === "graded") {
      setGradeData({
        level: sub.level || "Hoàn thành",
        score: sub.score !== undefined ? sub.score : 10,
        comment: sub.comment || "",
        stars: sub.stars || 0
      });
    } else if (assignment?.type === "quiz" || assignment?.type === "video") {
      let correctCount = 0;
      assignment.questions?.forEach((q: any, i: number) => {
        const studentAnswer = sub.content?.text ? sub.content.text[i] : (sub.content ? sub.content[i] : null);
        if (studentAnswer === q.answer) correctCount++;
      });
      setGradeData(prev => ({ ...prev, stars: correctCount, score: correctCount }));
    } else {
      setGradeData(prev => ({ ...prev, stars: 1, score: 10 }));
    }
  }, [assignment, sub]);

  const handleSuggest = async () => {
    setIsSuggesting(true);
    const suggestion = await suggestComment(sub.content, studentName, assignment);
    if (suggestion) {
      setGradeData({ ...gradeData, comment: suggestion.comment || "", level: suggestion.level || gradeData.level });
    }
    setIsSuggesting(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">{studentName}</h3>
          <p className="text-sm text-slate-500">{assignment?.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${sub.status === 'graded' ? 'bg-sky-100 text-sky-700' : sub.status === 'redo_requested' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {sub.status === 'graded' ? 'Đã chấm' : sub.status === 'redo_requested' ? 'Xin làm lại' : 'Đã nộp'}
          </span>
        </div>
      </div>
      
      <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
        <p className="text-sm font-medium text-slate-500 mb-2">Bài làm:</p>
        {assignment?.type === "essay" && (
          <div className="space-y-4">
            <p className="text-slate-700 whitespace-pre-wrap">{typeof sub.content === 'string' ? sub.content : (sub.content?.text || '')}</p>
            {sub.content?.attachments && sub.content.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-600 mb-2">Tệp đính kèm:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {sub.content.attachments.map((att: any, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden border-2 border-slate-200 bg-white aspect-square flex flex-col">
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedImage(att.url)} />
                      ) : (
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center p-2 text-center hover:bg-slate-50 transition-colors">
                          {att.type === 'link' ? <ImageIcon className="w-8 h-8 text-amber-400 mb-1" /> : <Paperclip className="w-8 h-8 text-emerald-400 mb-1" />}
                          <span className="text-xs font-bold text-slate-600 line-clamp-2 break-all">{att.name}</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {(assignment?.type === "quiz" || assignment?.type === "video") && (
          <div className="space-y-4">
            <div className="space-y-3">
              {assignment.questions?.map((q: any, i: number) => {
                const studentAnswer = sub.content?.text ? sub.content.text[i] : (sub.content ? sub.content[i] : null);
                const isCorrect = studentAnswer === q.answer;
                return (
                  <div key={i} className={`p-3 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <p className="font-medium text-slate-800 mb-1">Câu {i + 1}: {q.q}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">Học sinh chọn: <strong className={isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{studentAnswer || "Chưa trả lời"}</strong></span>
                      {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                    </div>
                    {!isCorrect && <p className="text-sm text-emerald-600 mt-1">Đáp án đúng: <strong>{q.answer}</strong></p>}
                  </div>
                );
              })}
            </div>
            {sub.content?.attachments && sub.content.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-600 mb-2">Tệp đính kèm:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {sub.content.attachments.map((att: any, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden border-2 border-slate-200 bg-white aspect-square flex flex-col">
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedImage(att.url)} />
                      ) : (
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center p-2 text-center hover:bg-slate-50 transition-colors">
                          {att.type === 'link' ? <ImageIcon className="w-8 h-8 text-amber-400 mb-1" /> : <Paperclip className="w-8 h-8 text-emerald-400 mb-1" />}
                          <span className="text-xs font-bold text-slate-600 line-clamp-2 break-all">{att.name}</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!isGrading ? (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {sub.status === "graded" && (
            <div className="flex gap-4 items-center">
              <div className="bg-sky-50 px-4 py-2 rounded-xl border border-sky-100">
                <p className="text-xs text-sky-600 font-medium">Kết quả hiện tại</p>
                <p className="font-bold text-slate-800">
                  {assignment?.gradingType === 'score' ? `${sub.score} điểm` : sub.level}
                </p>
              </div>
              <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-600 font-medium">Sao thưởng</p>
                <p className="font-bold text-amber-500">{sub.stars} 🌟</p>
              </div>
            </div>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            {sub.status === "redo_requested" && (
              <button 
                onClick={() => onApproveRedo(sub.id)} 
                className="flex-1 sm:flex-none bg-purple-100 text-purple-700 hover:bg-purple-200 px-6 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Cho phép làm lại
              </button>
            )}
            <button 
              onClick={() => setIsGrading(true)} 
              className={`flex-1 sm:flex-none ${sub.status === 'graded' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-sky-500 text-white hover:bg-sky-600'} px-6 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2`}
            >
              {sub.status === 'graded' ? <><Edit className="w-4 h-4" /> Chấm lại</> : 'Chấm bài'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assignment?.gradingType === "score" ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Điểm số (0-10)</label>
                <input type="number" min="0" max="10" value={gradeData.score} onChange={e => setGradeData({...gradeData, score: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mức độ hoàn thành</label>
                <select value={gradeData.level} onChange={e => setGradeData({...gradeData, level: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none">
                  <option value="Hoàn thành tốt">Hoàn thành tốt</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số sao thưởng 🌟</label>
              <input type="number" min="0" value={gradeData.stars} onChange={e => setGradeData({...gradeData, stars: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none font-bold text-amber-500" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Nhận xét</label>
              <button type="button" onClick={handleSuggest} disabled={isSuggesting} className="text-xs text-sky-600 flex items-center gap-1 hover:underline">
                <Sparkles className="w-3 h-3" /> {isSuggesting ? "Đang tạo..." : "AI Gợi ý"}
              </button>
            </div>
            <textarea value={gradeData.comment} onChange={e => setGradeData({...gradeData, comment: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none min-h-[80px]"></textarea>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsGrading(false)} className="px-4 py-2 text-slate-600 font-medium">Hủy</button>
            <button onClick={() => { onGrade(sub.id, gradeData); setIsGrading(false); }} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-emerald-600 transition-colors">Lưu kết quả</button>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full max-h-full flex items-center justify-center">
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={selectedImage} alt="Phóng to" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
}
