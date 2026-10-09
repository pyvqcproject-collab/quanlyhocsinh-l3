import React, { useState, useEffect, useMemo } from "react";
import { 
  Check, 
  X, 
  Clock, 
  Calendar, 
  Search, 
  Save, 
  Download, 
  Award, 
  Star, 
  Sparkles, 
  UserCheck, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Users,
  Eye,
  BookOpen,
  Filter
} from "lucide-react";
import { 
  AttendanceRecord, 
  EvaluationRecord, 
  saveAttendanceBatch, 
  subscribeToAttendance, 
  subscribeToAttendanceByDate, 
  saveEvaluation, 
  deleteEvaluation, 
  subscribeToEvaluations 
} from "../firebase/db";
import { exportStudentToExcel, exportClassAttendanceToExcel, exportClassEvaluationsToExcel } from "../utils/studentExcelExporter";

interface Props {
  students: any[];
  assignments: any[];
  submissions: any[];
  badges: any[];
  appSettings: any;
  currentTeacherName?: string;
  initialSelectedStudentId?: string | null;
  onCloseStudentDetail?: () => void;
}

// Preset comment suggestions according to Circular 27 for Grade 3
const PRESET_COMMENTS = [
  "Bé rất chăm chỉ, tích cực hăng hái phát biểu xây dựng bài.",
  "Hoàn thành xuất sắc các nhiệm vụ học tập trong ngày.",
  "Chữ viết sạch đẹp, trình bày bài cẩn thận và rõ ràng.",
  "Có tiến bộ vượt bậc môn Toán, giải toán nhanh và chính xác.",
  "Tiếp thu bài nhanh, ngoan ngoãn và biết giúp đỡ bạn bè.",
  "Cần chú ý tập trung lắng nghe cô giảng bài hơn.",
  "Cần rèn luyện thêm tính cẩn thận khi làm các bài tính toán.",
  "Học bài chăm ngoan, chấp hành tốt nội quy lớp học."
];

export default function AttendanceAndEvaluation({
  students,
  assignments,
  submissions,
  badges,
  appSettings,
  currentTeacherName = "Cô Lan",
  initialSelectedStudentId = null,
  onCloseStudentDetail
}: Props) {
  // Main Sub-Tab: "attendance" or "evaluations"
  const [subTab, setSubTab] = useState<"attendance" | "evaluations">("attendance");

  // Date state for attendance (default today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Local Attendance State for the selected date: studentId -> { status, note }
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: 'present' | 'excused' | 'unexcused' | 'late'; note: string }>>({});
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSaveMessage, setAttendanceSaveMessage] = useState<string | null>(null);

  // Evaluations state
  const [allEvaluations, setAllEvaluations] = useState<EvaluationRecord[]>([]);
  const [evaluationPeriod, setEvaluationPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [evaluationPeriodDate, setEvaluationPeriodDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedStudentForEval, setSelectedStudentForEval] = useState<any | null>(null);
  const [evalForm, setEvalForm] = useState<{
    overallRating: 'Tốt' | 'Đạt' | 'Cần cố gắng';
    academicEffort: string;
    discipline: string;
    teamwork: string;
    comment: string;
  }>({
    overallRating: 'Tốt',
    academicEffort: 'Tích cực, hăng hái',
    discipline: 'Ngoan, gương mẫu',
    teamwork: 'Hòa đồng, giúp đỡ bạn bè',
    comment: ''
  });
  const [isSavingEval, setIsSavingEval] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Student Profile Detail Modal
  const [studentDetailProfile, setStudentDetailProfile] = useState<any | null>(null);

  // Subscribe to all attendance
  useEffect(() => {
    const unsub = subscribeToAttendance(setAllAttendance);
    return () => unsub();
  }, []);

  // Subscribe to attendance for currently selected date
  useEffect(() => {
    const unsub = subscribeToAttendanceByDate(selectedDate, (records) => {
      const map: Record<string, { status: 'present' | 'excused' | 'unexcused' | 'late'; note: string }> = {};
      
      // Initialize with default 'present' for all students if no record exists yet
      students.forEach(s => {
        const found = records.find(r => r.studentId === s.id);
        if (found) {
          map[s.id] = { status: found.status, note: found.note || "" };
        } else {
          // Default to 'present' for easy 1-click workflows
          map[s.id] = { status: 'present', note: "" };
        }
      });
      setAttendanceMap(map);
    });

    return () => unsub();
  }, [selectedDate, students]);

  // Subscribe to all evaluations
  useEffect(() => {
    const unsub = subscribeToEvaluations(setAllEvaluations);
    return () => unsub();
  }, []);

  // Handle external selection of student detail
  useEffect(() => {
    if (initialSelectedStudentId) {
      const found = students.find(s => s.id === initialSelectedStudentId);
      if (found) {
        setStudentDetailProfile(found);
      }
    }
  }, [initialSelectedStudentId, students]);

  // Navigate date
  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Quick mark all present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: 'present' | 'excused' | 'unexcused' | 'late'; note: string }> = {};
    students.forEach(s => {
      updated[s.id] = {
        status: 'present',
        note: attendanceMap[s.id]?.note || ""
      };
    });
    setAttendanceMap(updated);
  };

  // Toggle or set student attendance status
  const handleSetStudentStatus = (studentId: string, status: 'present' | 'excused' | 'unexcused' | 'late') => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { note: "" }),
        status
      }
    }));
  };

  const handleSetStudentNote = (studentId: string, note: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'present' }),
        note
      }
    }));
  };

  // Save attendance batch
  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    setAttendanceSaveMessage(null);
    try {
      const recordsToSave = students.map(s => {
        const item = attendanceMap[s.id] || { status: 'present', note: "" };
        return {
          studentId: s.id,
          status: item.status,
          note: item.note
        };
      });

      await saveAttendanceBatch(selectedDate, recordsToSave, currentTeacherName);
      setAttendanceSaveMessage("Đã lưu điểm danh thành công! ✅");
      setTimeout(() => setAttendanceSaveMessage(null), 3000);
    } catch (err: any) {
      console.error("Lỗi khi lưu điểm danh:", err);
      alert("Lỗi khi lưu điểm danh: " + err.message);
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Attendance metrics for selected date
  const attendanceMetrics = useMemo(() => {
    const total = students.length;
    let present = 0;
    let excused = 0;
    let unexcused = 0;
    let late = 0;

    students.forEach(s => {
      const status = attendanceMap[s.id]?.status || 'present';
      if (status === 'present') present++;
      else if (status === 'excused') excused++;
      else if (status === 'unexcused') unexcused++;
      else if (status === 'late') late++;
    });

    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { total, present, excused, unexcused, late, rate };
  }, [students, attendanceMap]);

  // Compute label for evaluation period
  const getPeriodLabel = () => {
    if (evaluationPeriod === 'daily') {
      return `Ngày ${selectedDate.split('-').reverse().join('/')}`;
    }
    if (evaluationPeriod === 'weekly') {
      const d = new Date(selectedDate);
      const day = d.getDate();
      const weekNum = Math.ceil(day / 7);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `Tuần ${weekNum} - Tháng ${month}/${year}`;
    }
    const d = new Date(selectedDate);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `Tháng ${month}/${year}`;
  };

  // Open evaluation form for a student
  const handleOpenEvaluationModal = (student: any) => {
    setSelectedStudentForEval(student);
    const periodLabel = getPeriodLabel();
    const existing = allEvaluations.find(
      e => e.studentId === student.id && e.period === evaluationPeriod && e.periodLabel === periodLabel
    );

    if (existing) {
      setEvalForm({
        overallRating: existing.overallRating,
        academicEffort: existing.academicEffort,
        discipline: existing.discipline,
        teamwork: existing.teamwork,
        comment: existing.comment
      });
    } else {
      setEvalForm({
        overallRating: 'Tốt',
        academicEffort: 'Tích cực, hăng hái',
        discipline: 'Ngoan, gương mẫu',
        teamwork: 'Hòa đồng, giúp đỡ bạn bè',
        comment: ''
      });
    }
  };

  // Save evaluation
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForEval) return;
    setIsSavingEval(true);
    try {
      const periodLabel = getPeriodLabel();
      const existing = allEvaluations.find(
        e => e.studentId === selectedStudentForEval.id && e.period === evaluationPeriod && e.periodLabel === periodLabel
      );

      await saveEvaluation({
        id: existing?.id,
        studentId: selectedStudentForEval.id,
        studentName: selectedStudentForEval.name,
        period: evaluationPeriod,
        date: selectedDate,
        periodLabel,
        overallRating: evalForm.overallRating,
        academicEffort: evalForm.academicEffort,
        discipline: evalForm.discipline,
        teamwork: evalForm.teamwork,
        comment: evalForm.comment,
        teacherName: currentTeacherName
      });

      setSelectedStudentForEval(null);
    } catch (err: any) {
      console.error("Lỗi khi lưu đánh giá:", err);
      alert("Lỗi khi lưu đánh giá: " + err.message);
    } finally {
      setIsSavingEval(false);
    }
  };

  // Export individual student to Excel
  const handleExportSingleStudent = (student: any) => {
    const studentAttendance = allAttendance.filter(a => a.studentId === student.id);
    const studentEvals = allEvaluations.filter(e => e.studentId === student.id);
    const studentBadges = badges.filter(b => b.studentId === student.id);

    exportStudentToExcel({
      student,
      attendanceList: studentAttendance,
      assignmentsList: assignments,
      submissionsList: submissions,
      evaluationsList: studentEvals,
      badgesList: studentBadges,
      appSettings
    });
  };

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = searchTerm === "" || 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.id?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (subTab === 'attendance' && statusFilter !== 'all') {
        const status = attendanceMap[s.id]?.status || 'present';
        return status === statusFilter;
      }

      if (subTab === 'evaluations' && statusFilter !== 'all') {
        const periodLabel = getPeriodLabel();
        const hasEval = allEvaluations.some(
          e => e.studentId === s.id && e.period === evaluationPeriod && e.periodLabel === periodLabel
        );
        if (statusFilter === 'evaluated') return hasEval;
        if (statusFilter === 'pending') return !hasEval;
      }

      return true;
    });
  }, [students, searchTerm, statusFilter, subTab, attendanceMap, allEvaluations, evaluationPeriod, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Top Android Material Segmented Sub-Nav */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto p-1 bg-slate-100/90 rounded-2xl">
          <button
            onClick={() => setSubTab("attendance")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              subTab === "attendance"
                ? "bg-white text-emerald-600 shadow-sm shadow-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-4 h-4" /> Điểm danh mỗi ngày
          </button>

          <button
            onClick={() => setSubTab("evaluations")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              subTab === "evaluations"
                ? "bg-white text-indigo-600 shadow-sm shadow-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Đánh giá ngày / tuần / tháng
          </button>
        </div>

        {/* Global Export actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {subTab === "attendance" ? (
            <button
              onClick={() => exportClassAttendanceToExcel({
                students,
                attendanceList: allAttendance,
                date: selectedDate,
                className: appSettings.className || "Lớp 3"
              })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors border border-emerald-200 cursor-pointer active:scale-95"
              title="Xuất danh sách điểm danh ngày này sang Excel"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel Điểm danh
            </button>
          ) : (
            <button
              onClick={() => exportClassEvaluationsToExcel({
                students,
                evaluationsList: allEvaluations,
                period: evaluationPeriod,
                periodLabel: getPeriodLabel(),
                className: appSettings.className || "Lớp 3"
              })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors border border-indigo-200 cursor-pointer active:scale-95"
              title="Xuất bảng đánh giá kỳ này sang Excel"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel Đánh giá
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: ATTENDANCE (ĐIỂM DANH HÀNG NGÀY) */}
      {/* ============================================================== */}
      {subTab === "attendance" && (
        <div className="space-y-6">
          {/* Date Picker Bar & Quick Metrics */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeDate(-1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title="Hôm trước"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => changeDate(1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title="Hôm sau"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={goToToday}
                  className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Hôm nay
                </button>
              </div>

              {/* Action Buttons: 1-click All Present & Save */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs sm:text-sm border border-slate-200 transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" /> Tất cả Có mặt
                </button>

                <button
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {isSavingAttendance ? "Đang lưu..." : "Lưu điểm danh"}
                </button>
              </div>
            </div>

            {/* Attendance Status Banner Notification if saved */}
            {attendanceSaveMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {attendanceSaveMessage}
              </div>
            )}

            {/* Metrics Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sĩ số lớp</span>
                <span className="text-xl font-extrabold text-slate-800">{attendanceMetrics.total} HS</span>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Có mặt</span>
                <span className="text-xl font-extrabold text-emerald-800">{attendanceMetrics.present}</span>
              </div>

              <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-center">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Vắng phép</span>
                <span className="text-xl font-extrabold text-amber-800">{attendanceMetrics.excused}</span>
              </div>

              <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200 text-center">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Không phép</span>
                <span className="text-xl font-extrabold text-rose-800">{attendanceMetrics.unexcused}</span>
              </div>

              <div className="bg-orange-50/70 p-3 rounded-2xl border border-orange-200 text-center">
                <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">Đi muộn</span>
                <span className="text-xl font-extrabold text-orange-800">{attendanceMetrics.late}</span>
              </div>

              <div className="bg-sky-50/70 p-3 rounded-2xl border border-sky-200 text-center">
                <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">Tỷ lệ ngày</span>
                <span className="text-xl font-extrabold text-sky-800">{attendanceMetrics.rate}%</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm học sinh theo tên hoặc mã số..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả ({students.length})
              </button>
              <button
                onClick={() => setStatusFilter("present")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "present" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Có mặt ({attendanceMetrics.present})
              </button>
              <button
                onClick={() => setStatusFilter("excused")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "excused" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                Có phép ({attendanceMetrics.excused})
              </button>
              <button
                onClick={() => setStatusFilter("unexcused")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "unexcused" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                Không phép ({attendanceMetrics.unexcused})
              </button>
              <button
                onClick={() => setStatusFilter("late")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "late" ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                Đi muộn ({attendanceMetrics.late})
              </button>
            </div>
          </div>

          {/* Attendance Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((s, idx) => {
              const currentStatus = attendanceMap[s.id]?.status || 'present';
              const currentNote = attendanceMap[s.id]?.note || "";

              return (
                <div
                  key={s.id}
                  className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Student Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-extrabold text-base shrink-0 shadow-xs">
                        {s.avatarUrl ? (
                          <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          (s.name ? s.name.charAt(0) : "H").toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 
                            onClick={() => setStudentDetailProfile(s)}
                            className="font-extrabold text-sm sm:text-base text-slate-800 truncate hover:text-sky-600 cursor-pointer transition-colors"
                          >
                            {s.name}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                            {s.id?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">
                          {s.gender || "Học sinh"} {s.birthdate ? `· ${s.birthdate}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Quick Excel export button for this single student */}
                    <button
                      onClick={() => handleExportSingleStudent(s)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="Xuất hồ sơ Excel của riêng em này"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 4 Status Buttons (Android Material Buttons) */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(s.id, 'present')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-black'
                          : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <span>✅</span>
                      <span className="truncate">Có mặt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(s.id, 'excused')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                        currentStatus === 'excused'
                          ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30 font-black'
                          : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <span>📝</span>
                      <span className="truncate">Có phép</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(s.id, 'unexcused')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                        currentStatus === 'unexcused'
                          ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30 font-black'
                          : 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                    >
                      <span>❌</span>
                      <span className="truncate">K.Phép</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(s.id, 'late')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                        currentStatus === 'late'
                          ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30 font-black'
                          : 'bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                      }`}
                    >
                      <span>⏰</span>
                      <span className="truncate">Đi muộn</span>
                    </button>
                  </div>

                  {/* Note Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Lý do nghỉ / ghi chú (ví dụ: sốt nhẹ, xin về sớm...)..."
                      value={currentNote}
                      onChange={(e) => handleSetStudentNote(s.id, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      onClick={() => setStudentDetailProfile(s)}
                      className="text-xs font-bold text-sky-600 hover:underline whitespace-nowrap shrink-0 px-1"
                    >
                      Xem hồ sơ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: PERIODIC EVALUATIONS (ĐÁNH GIÁ NGÀY / TUẦN / THÁNG) */}
      {/* ============================================================== */}
      {subTab === "evaluations" && (
        <div className="space-y-6">
          {/* Period Selector Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-800">
                  Đánh giá định kỳ học sinh 🌟
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Đánh giá toàn diện theo tiêu chí ý thức học tập, kỷ luật nề nếp và tinh thần đoàn kết (Thông tư 27 tiểu học).
                </p>
              </div>

              {/* Period Chips (Daily / Weekly / Monthly) */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
                <button
                  onClick={() => setEvaluationPeriod("daily")}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    evaluationPeriod === "daily" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📅 Cuối ngày
                </button>
                <button
                  onClick={() => setEvaluationPeriod("weekly")}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    evaluationPeriod === "weekly" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📆 Cuối tuần
                </button>
                <button
                  onClick={() => setEvaluationPeriod("monthly")}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    evaluationPeriod === "monthly" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🗓️ Cuối tháng
                </button>
              </div>
            </div>

            {/* Currently Active Period Tag */}
            <div className="flex items-center justify-between gap-2 p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span className="text-xs sm:text-sm font-extrabold text-indigo-900">
                  Đang chọn kỳ: <strong className="underline">{getPeriodLabel()}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white px-2.5 py-1 rounded-xl border border-indigo-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Evaluations Student List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((s) => {
              const periodLabel = getPeriodLabel();
              const evalRecord = allEvaluations.find(
                e => e.studentId === s.id && e.period === evaluationPeriod && e.periodLabel === periodLabel
              );

              return (
                <div
                  key={s.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-base shrink-0">
                          {s.avatarUrl ? (
                            <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            (s.name ? s.name.charAt(0) : "H").toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 
                            onClick={() => setStudentDetailProfile(s)}
                            className="font-extrabold text-sm sm:text-base text-slate-800 hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            {s.name}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            {s.id?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {evalRecord ? (
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl ${
                          evalRecord.overallRating === 'Tốt' ? 'bg-emerald-100 text-emerald-800' :
                          evalRecord.overallRating === 'Đạt' ? 'bg-sky-100 text-sky-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          🌟 {evalRecord.overallRating}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                          Chưa đánh giá
                        </span>
                      )}
                    </div>

                    {evalRecord ? (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                        <p className="text-slate-600 font-semibold line-clamp-2">
                          "{evalRecord.comment || "Đã đánh giá thành công."}"
                        </p>
                        <div className="flex flex-wrap gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 font-medium">
                          <span>{evalRecord.academicEffort}</span>
                          <span>·</span>
                          <span>{evalRecord.discipline}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Bấm nút bên dưới để nhập nhận xét và xếp loại cho bé...
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEvaluationModal(s)}
                      className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> {evalRecord ? "Sửa nhận xét" : "Đánh giá ngay"}
                    </button>

                    <button
                      onClick={() => handleExportSingleStudent(s)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="Xuất Excel hồ sơ học sinh"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EVALUATION FORM MODAL */}
      {/* ============================================================== */}
      {selectedStudentForEval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
            <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">
                  Đánh giá: {selectedStudentForEval.name}
                </h3>
                <p className="text-indigo-200 text-xs">
                  Kỳ đánh giá: {getPeriodLabel()}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForEval(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Overall rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Xếp loại chung
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Tốt', 'Đạt', 'Cần cố gắng'] as const).map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setEvalForm({ ...evalForm, overallRating: rate })}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        evalForm.overallRating === rate
                          ? rate === 'Tốt'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            : rate === 'Đạt'
                            ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                            : 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {rate === 'Tốt' ? '🌟 Tốt' : rate === 'Đạt' ? '👍 Đạt' : '💪 Cố gắng'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Criteria: Academic Effort */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ý thức học tập
                </label>
                <select
                  value={evalForm.academicEffort}
                  onChange={(e) => setEvalForm({ ...evalForm, academicEffort: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 outline-none"
                >
                  <option value="Tích cực, hăng hái">Tích cực, hăng hái phát biểu</option>
                  <option value="Chăm chỉ, làm bài đầy đủ">Chăm chỉ, làm bài đầy đủ</option>
                  <option value="Có tiến bộ rõ rệt">Có tiến bộ rõ rệt</option>
                  <option value="Cần tập trung hơn trong giờ">Cần tập trung hơn trong giờ</option>
                  <option value="Cần rèn tính tự giác">Cần rèn tính tự giác</option>
                </select>
              </div>

              {/* Criteria: Discipline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kỷ luật & Nề nếp
                </label>
                <select
                  value={evalForm.discipline}
                  onChange={(e) => setEvalForm({ ...evalForm, discipline: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 outline-none"
                >
                  <option value="Ngoan, gương mẫu">Ngoan ngoãn, gương mẫu</option>
                  <option value="Đúng giờ, chấp hành tốt">Đúng giờ, chấp hành tốt</option>
                  <option value="Cần chú ý trật tự hơn">Cần chú ý trật tự hơn</option>
                  <option value="Cần chuẩn bị đồ dùng chu đáo hơn">Cần chuẩn bị đồ dùng chu đáo hơn</option>
                </select>
              </div>

              {/* Criteria: Teamwork */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tinh thần đoàn kết
                </label>
                <select
                  value={evalForm.teamwork}
                  onChange={(e) => setEvalForm({ ...evalForm, teamwork: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 outline-none"
                >
                  <option value="Hòa đồng, giúp đỡ bạn bè">Hòa đồng, giúp đỡ bạn bè</option>
                  <option value="Hợp tác nhóm tốt">Hợp tác nhóm tốt</option>
                  <option value="Cần cởi mở, tự tin hơn">Cần cởi mở, tự tin hơn</option>
                </select>
              </div>

              {/* Comment text area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lời nhận xét của cô giáo
                </label>
                <textarea
                  rows={3}
                  value={evalForm.comment}
                  onChange={(e) => setEvalForm({ ...evalForm, comment: e.target.value })}
                  placeholder="Nhập nhận xét cụ thể hoặc chọn mẫu câu bên dưới..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-medium"
                  required
                />

                {/* Quick Preset Comment Chips */}
                <div className="mt-2">
                  <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">Gợi ý mẫu nhận xét nhanh (Bấm để chèn):</p>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {PRESET_COMMENTS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEvalForm(prev => ({
                          ...prev,
                          comment: prev.comment ? `${prev.comment} ${preset}` : preset
                        }))}
                        className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer text-left"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForEval(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingEval}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingEval ? "Đang lưu..." : "Lưu đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STUDENT FULL TRACKING PROFILE & EXCEL EXPORT MODAL */}
      {/* ============================================================== */}
      {studentDetailProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl my-6 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 p-6 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white font-extrabold text-2xl flex items-center justify-center border-2 border-white/40 shadow-inner">
                  {studentDetailProfile.avatarUrl ? (
                    <img src={studentDetailProfile.avatarUrl} alt={studentDetailProfile.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    (studentDetailProfile.name ? studentDetailProfile.name.charAt(0) : "H").toUpperCase()
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl leading-tight">
                    {studentDetailProfile.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-sky-100 mt-1 font-semibold">
                    <span>Mã HS: {studentDetailProfile.id?.toUpperCase()}</span>
                    <span>·</span>
                    <span>{studentDetailProfile.gender || "Học sinh"}</span>
                    <span>·</span>
                    <span>{studentDetailProfile.birthdate ? `Sinh: ${studentDetailProfile.birthdate}` : ""}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportSingleStudent(studentDetailProfile)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-700 font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer hover:bg-emerald-50"
                  title="Xuất file Excel của học sinh này"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất Excel
                </button>

                <button
                  onClick={() => {
                    setStudentDetailProfile(null);
                    if (onCloseStudentDetail) onCloseStudentDetail();
                  }}
                  className="w-9 h-9 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Stat Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const studentAtt = allAttendance.filter(a => a.studentId === studentDetailProfile.id);
                  const present = studentAtt.filter(a => a.status === 'present').length;
                  const rate = studentAtt.length > 0 ? Math.round((present / studentAtt.length) * 100) : 100;
                  const studentSubs = submissions.filter(s => s.studentId === studentDetailProfile.id);
                  const studentBadges = badges.filter(b => b.studentId === studentDetailProfile.id);

                  return (
                    <>
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chuyên cần</span>
                        <span className="text-xl font-extrabold text-emerald-600">{rate}%</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{present}/{studentAtt.length} buổi</span>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bài tập đã nộp</span>
                        <span className="text-xl font-extrabold text-sky-600">{studentSubs.length}/{assignments.length}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">hoàn thành</span>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Huy hiệu</span>
                        <span className="text-xl font-extrabold text-amber-500">{studentBadges.length} 🏅</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">danh dự</span>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Lượt quay dùng</span>
                        <span className="text-xl font-extrabold text-indigo-600">{studentDetailProfile.spinsUsed || 0} 🎡</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">vòng quay</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Attendance History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Lịch sử Điểm danh gần đây
                  </h4>
                  <span className="text-xs text-slate-400 font-semibold">
                    {allAttendance.filter(a => a.studentId === studentDetailProfile.id).length} ngày đã ghi nhận
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {allAttendance.filter(a => a.studentId === studentDetailProfile.id).length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">Chưa có dữ liệu điểm danh</div>
                  ) : (
                    allAttendance
                      .filter(a => a.studentId === studentDetailProfile.id)
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((att, i) => (
                        <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                          <div>
                            <span className="font-bold text-slate-800">{att.date}</span>
                            {att.note && <span className="text-slate-400 ml-2">({att.note})</span>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${
                            att.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                            att.status === 'excused' ? 'bg-amber-100 text-amber-800' :
                            att.status === 'late' ? 'bg-orange-100 text-orange-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {att.status === 'present' ? 'Có mặt' : att.status === 'excused' ? 'Có phép' : att.status === 'late' ? 'Đi muộn' : 'K.Phép'}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Evaluations History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Lịch sử Đánh giá định kỳ
                  </h4>
                  <span className="text-xs text-slate-400 font-semibold">
                    {allEvaluations.filter(e => e.studentId === studentDetailProfile.id).length} đợt đánh giá
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {allEvaluations.filter(e => e.studentId === studentDetailProfile.id).length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 border border-slate-200 rounded-2xl">Chưa có đánh giá định kỳ nào</div>
                  ) : (
                    allEvaluations
                      .filter(e => e.studentId === studentDetailProfile.id)
                      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                      .map((ev, i) => (
                        <div key={i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{ev.periodLabel}</span>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                              {ev.overallRating}
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium">"{ev.comment}"</p>
                          <div className="flex gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                            <span>Ý thức: {ev.academicEffort}</span>
                            <span>·</span>
                            <span>Kỷ luật: {ev.discipline}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Tất cả dữ liệu được lưu trữ tự động trên hệ thống
              </span>
              <button
                onClick={() => handleExportSingleStudent(studentDetailProfile)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Xuất file dữ liệu sang Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
