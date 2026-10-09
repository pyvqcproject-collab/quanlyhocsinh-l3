import * as XLSX from "xlsx";
import { AttendanceRecord, EvaluationRecord } from "../firebase/db";

export interface StudentProfileData {
  student: any;
  attendanceList: AttendanceRecord[];
  assignmentsList: any[];
  submissionsList: any[];
  evaluationsList: EvaluationRecord[];
  badgesList: any[];
  appSettings?: any;
}

/**
 * Xuất hồ sơ toàn diện của một học sinh ra file Excel với nhiều bảng tính (Sheets)
 */
export function exportStudentToExcel({
  student,
  attendanceList,
  assignmentsList,
  submissionsList,
  evaluationsList,
  badgesList,
  appSettings = {}
}: StudentProfileData) {
  const wb = XLSX.utils.book_new();

  // 1. Thống kê Chuyên cần
  const totalDays = attendanceList.length;
  const presentDays = attendanceList.filter(a => a.status === 'present').length;
  const excusedDays = attendanceList.filter(a => a.status === 'excused').length;
  const unexcusedDays = attendanceList.filter(a => a.status === 'unexcused').length;
  const lateDays = attendanceList.filter(a => a.status === 'late').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // 2. Thống kê Bài tập
  const studentSubs = submissionsList.filter(s => s.studentId === student.id);
  const completedCount = studentSubs.filter(s => s.status === 'graded' || s.status === 'submitted').length;
  const totalAssignments = assignmentsList.length;
  const assignmentRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

  // Tính tổng sao
  let totalStars = 0;
  studentSubs.forEach(s => {
    if (s.stars) totalStars += Number(s.stars) || 0;
  });

  // ----------------------------------------------------
  // SHEET 1: TỔNG QUAN HỒ SƠ HỌC SINH
  // ----------------------------------------------------
  const overviewData = [
    { "HẠNG MỤC": "THÔNG TIN CÁ NHÂN", "CHI TIẾT": "" },
    { "HẠNG MỤC": "Mã số học sinh", "CHI TIẾT": student.id?.toUpperCase() },
    { "HẠNG MỤC": "Họ và tên", "CHI TIẾT": student.name || "Chưa cập nhật" },
    { "HẠNG MỤC": "Giới tính", "CHI TIẾT": student.gender || "Chưa cập nhật" },
    { "HẠNG MỤC": "Ngày sinh", "CHI TIẾT": student.birthdate || "Chưa cập nhật" },
    { "HẠNG MỤC": "Lớp học", "CHI TIẾT": appSettings.className || "Lớp 3" },
    { "HẠNG MỤC": "Trường học", "CHI TIẾT": appSettings.schoolName || "Trường Tiểu học" },
    { "HẠNG MỤC": "Giáo viên chủ nhiệm", "CHI TIẾT": appSettings.teacherName || "Giáo viên" },
    { "HẠNG MỤC": "", "CHI TIẾT": "" },
    { "HẠNG MỤC": "CHỈ SỐ CHUYÊN CẦN", "CHI TIẾT": "" },
    { "HẠNG MỤC": "Tỷ lệ chuyên cần", "CHI TIẾT": `${attendanceRate}%` },
    { "HẠNG MỤC": "Tổng số buổi đã điểm danh", "CHI TIẾT": `${totalDays} buổi` },
    { "HẠNG MỤC": "Số buổi có mặt", "CHI TIẾT": `${presentDays} buổi` },
    { "HẠNG MỤC": "Số buổi vắng có phép", "CHI TIẾT": `${excusedDays} buổi` },
    { "HẠNG MỤC": "Số buổi vắng không phép", "CHI TIẾT": `${unexcusedDays} buổi` },
    { "HẠNG MỤC": "Số buổi đi muộn", "CHI TIẾT": `${lateDays} buổi` },
    { "HẠNG MỤC": "", "CHI TIẾT": "" },
    { "HẠNG MỤC": "CHỈ SỐ HỌC TẬP & THÀNH TÍCH", "CHI TIẾT": "" },
    { "HẠNG MỤC": "Số bài tập đã giao", "CHI TIẾT": `${totalAssignments} bài` },
    { "HẠNG MỤC": "Số bài đã hoàn thành", "CHI TIẾT": `${completedCount} bài (${assignmentRate}%)` },
    { "HẠNG MỤC": "Tổng sao khen thưởng đạt được", "CHI TIẾT": `${totalStars} sao 🌟` },
    { "HẠNG MỤC": "Huy hiệu danh dự đạt được", "CHI TIẾT": `${badgesList.length} huy hiệu 🏅` },
    { "HẠNG MỤC": "Danh sách huy hiệu", "CHI TIẾT": badgesList.map(b => b.name).join(", ") || "Chưa có" },
    { "HẠNG MỤC": "", "CHI TIẾT": "" },
    { "HẠNG MỤC": "ĐÁNH GIÁ ĐỊNH KỲ GẦN NHẤT", "CHI TIẾT": "" },
    {
      "HẠNG MỤC": "Kỳ đánh giá gần nhất",
      "CHI TIẾT": evaluationsList[0] ? evaluationsList[0].periodLabel : "Chưa có đánh giá"
    },
    {
      "HẠNG MỤC": "Mức độ hoàn thành",
      "CHI TIẾT": evaluationsList[0] ? evaluationsList[0].overallRating : "---"
    },
    {
      "HẠNG MỤC": "Nhận xét của giáo viên",
      "CHI TIẾT": evaluationsList[0] ? evaluationsList[0].comment : "---"
    },
    {
      "HẠNG MỤC": "Thời gian xuất báo cáo",
      "CHI TIẾT": new Date().toLocaleString("vi-VN")
    }
  ];

  const wsOverview = XLSX.utils.json_to_sheet(overviewData);
  // Cài đặt độ rộng cột cho sheet 1
  wsOverview["!cols"] = [{ wch: 32 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, "TongQuan");

  // ----------------------------------------------------
  // SHEET 2: LỊCH SỬ ĐIỂM DANH CHI TIẾT
  // ----------------------------------------------------
  const sortedAttendance = [...attendanceList].sort((a, b) => b.date.localeCompare(a.date));
  const attendanceData = sortedAttendance.map((item, index) => {
    let statusText = "Có mặt";
    if (item.status === 'excused') statusText = "Vắng có phép";
    if (item.status === 'unexcused') statusText = "Vắng không phép";
    if (item.status === 'late') statusText = "Đi muộn";

    const dateObj = new Date(item.date);
    const dayOfWeek = isNaN(dateObj.getTime())
      ? ""
      : ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][dateObj.getDay()];

    return {
      "STT": index + 1,
      "Ngày": item.date,
      "Thứ": dayOfWeek,
      "Trạng thái": statusText,
      "Ghi chú / Lý do": item.note || "",
      "Giáo viên điểm danh": item.teacherName || "Giáo viên",
      "Cập nhật lúc": item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : ""
    };
  });

  const wsAttendance = XLSX.utils.json_to_sheet(
    attendanceData.length > 0
      ? attendanceData
      : [{ "STT": 1, "Ngày": "Chưa có dữ liệu điểm danh", "Thứ": "", "Trạng thái": "", "Ghi chú": "" }]
  );
  wsAttendance["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 },
    { wch: 22 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAttendance, "DiemDanh_ChiTiet");

  // ----------------------------------------------------
  // SHEET 3: KẾT QUẢ BÀI TẬP VÀ ĐIỂM SỐ
  // ----------------------------------------------------
  const assignmentData = assignmentsList.map((a, index) => {
    const sub = studentSubs.find(s => s.assignmentId === a.id);
    let statusText = "Chưa nộp";
    if (sub) {
      if (sub.status === 'graded') statusText = "Đã chấm điểm";
      else if (sub.status === 'submitted') statusText = "Đã nộp (Chờ chấm)";
      else if (sub.status === 'redo_requested') statusText = "Xin làm lại";
      else if (sub.status === 'redo_approved') statusText = "Được phép làm lại";
    }

    let gradeText = "---";
    if (sub && sub.status === 'graded') {
      if (a.gradingType === 'score') {
        gradeText = sub.score !== undefined ? `${sub.score} điểm` : "Đã chấm";
      } else {
        gradeText = sub.level || "Hoàn thành";
      }
    }

    return {
      "STT": index + 1,
      "Tên bài tập": a.title,
      "Hình thức": a.type === 'essay' ? 'Tự luận' : a.type === 'video' ? 'Video' : 'Trắc nghiệm',
      "Hạn nộp": a.dueDate || "",
      "Trạng thái": statusText,
      "Thời gian nộp": sub?.submittedAt ? new Date(sub.submittedAt).toLocaleString("vi-VN") : "---",
      "Kết quả / Mức độ": gradeText,
      "Sao thưởng": sub?.stars ? `${sub.stars} sao` : "0",
      "Nhận xét của giáo viên": sub?.comment || "---"
    };
  });

  const wsAssignments = XLSX.utils.json_to_sheet(
    assignmentData.length > 0
      ? assignmentData
      : [{ "STT": 1, "Tên bài tập": "Chưa có bài tập nào", "Trạng thái": "" }]
  );
  wsAssignments["!cols"] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 12 },
    { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAssignments, "KetQua_BaiTap");

  // ----------------------------------------------------
  // SHEET 4: LỊCH SỬ ĐÁNH GIÁ ĐỊNH KỲ
  // ----------------------------------------------------
  const sortedEvaluations = [...evaluationsList].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const evaluationData = sortedEvaluations.map((item, index) => {
    let periodText = "Cuối ngày";
    if (item.period === 'weekly') periodText = "Cuối tuần";
    if (item.period === 'monthly') periodText = "Cuối tháng";

    return {
      "STT": index + 1,
      "Kỳ đánh giá": periodText,
      "Chi tiết kỳ": item.periodLabel || item.date,
      "Xếp loại chung": item.overallRating || "Tốt",
      "Ý thức học tập": item.academicEffort || "---",
      "Kỷ luật & Nề nếp": item.discipline || "---",
      "Tinh thần đoàn kết": item.teamwork || "---",
      "Lời nhận xét của cô giáo": item.comment || "",
      "Giáo viên đánh giá": item.teacherName || "Cô Lan",
      "Ngày đánh giá": item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""
    };
  });

  const wsEvaluations = XLSX.utils.json_to_sheet(
    evaluationData.length > 0
      ? evaluationData
      : [{ "STT": 1, "Kỳ đánh giá": "Chưa có đánh giá định kỳ nào", "Xếp loại chung": "" }]
  );
  wsEvaluations["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 45 },
    { wch: 20 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsEvaluations, "DanhGia_DinhKy");

  // Tạo tên file an toàn tiếng Việt
  const cleanName = (student.name || "HocSinh")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");
  const studentCode = student.id?.toUpperCase() || "HS";
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `HoSo_${cleanName}_${studentCode}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Xuất bảng điểm danh tổng hợp toàn bộ lớp ra file Excel
 */
export function exportClassAttendanceToExcel({
  students,
  attendanceList,
  date,
  className = "Lớp 3"
}: {
  students: any[];
  attendanceList: AttendanceRecord[];
  date: string;
  className?: string;
}) {
  const wb = XLSX.utils.book_new();

  const data = students.map((s, index) => {
    const record = attendanceList.find(a => a.studentId === s.id && a.date === date);
    let statusText = "Chưa điểm danh";
    if (record) {
      if (record.status === 'present') statusText = "Có mặt";
      else if (record.status === 'excused') statusText = "Vắng có phép";
      else if (record.status === 'unexcused') statusText = "Vắng không phép";
      else if (record.status === 'late') statusText = "Đi muộn";
    }

    return {
      "STT": index + 1,
      "Mã học sinh": s.id?.toUpperCase(),
      "Họ và tên": s.name,
      "Giới tính": s.gender || "",
      "Ngày điểm danh": date,
      "Trạng thái": statusText,
      "Ghi chú / Lý do": record?.note || "",
      "Giáo viên điểm danh": record?.teacherName || "Giáo viên"
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 25 },
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
    { wch: 30 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, "DiemDanh_ToanLop");
  XLSX.writeFile(wb, `BaoCao_DiemDanh_${className.replace(/\s+/g, '_')}_${date}.xlsx`);
}

/**
 * Xuất bảng đánh giá định kỳ toàn lớp ra file Excel
 */
export function exportClassEvaluationsToExcel({
  students,
  evaluationsList,
  period,
  periodLabel,
  className = "Lớp 3"
}: {
  students: any[];
  evaluationsList: EvaluationRecord[];
  period: string;
  periodLabel: string;
  className?: string;
}) {
  const wb = XLSX.utils.book_new();

  const data = students.map((s, index) => {
    const evalRecord = evaluationsList.find(
      e => e.studentId === s.id && e.period === period && e.periodLabel === periodLabel
    );

    return {
      "STT": index + 1,
      "Mã học sinh": s.id?.toUpperCase(),
      "Họ và tên": s.name,
      "Kỳ đánh giá": periodLabel,
      "Xếp loại chung": evalRecord?.overallRating || "Chưa đánh giá",
      "Ý thức học tập": evalRecord?.academicEffort || "---",
      "Kỷ luật & Nề nếp": evalRecord?.discipline || "---",
      "Tinh thần đoàn kết": evalRecord?.teamwork || "---",
      "Lời nhận xét của cô giáo": evalRecord?.comment || "---",
      "Thời gian đánh giá": evalRecord?.createdAt ? new Date(evalRecord.createdAt).toLocaleString("vi-VN") : "---"
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 25 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 45 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, "DanhGia_ToanLop");
  XLSX.writeFile(wb, `BaoCao_DanhGia_${className.replace(/\s+/g, '_')}_${periodLabel.replace(/\s+/g, '_')}.xlsx`);
}
