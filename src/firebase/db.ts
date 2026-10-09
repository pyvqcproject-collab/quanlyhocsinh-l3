import { db, isMockMode } from "./config";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";

// Default prizes for the lucky wheel
export const DEFAULT_WHEEL_PRIZES = [
  "10 điểm thưởng",
  "Huy hiệu Chăm chỉ",
  "Huy hiệu Thông thái",
  "Tràng pháo tay",
  "Thêm 1 lượt quay",
  "Chúc may mắn lần sau"
];

// Mock Data Store
const loadMockData = () => {
  const saved = localStorage.getItem('mockData');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.attendance) parsed.attendance = [];
    if (!parsed.evaluations) parsed.evaluations = [];
    if (!parsed.appSettings) parsed.appSettings = {};
    if (!parsed.appSettings.wheelPrizes || !parsed.appSettings.wheelPrizes.length) {
      parsed.appSettings.wheelPrizes = [...DEFAULT_WHEEL_PRIZES];
    }
    return parsed;
  }
  return {
    users: [
      { id: "teacher-1", email: "teacher@school.com", role: "teacher", name: "Cô Lan", password: "123456", isAdmin: true }
    ],
    assignments: [],
    submissions: [],
    badges: [],
    posts: [],
    notifications: [],
    attendance: [],
    evaluations: [],
    appSettings: {
      teacherName: "Cô Lan",
      schoolName: "Trường Tiểu học ABC",
      className: "Lớp 3A",
      avatarUrl: "",
      appName: "Ứng dụng Quản lý Lớp học",
      wheelPrizes: [...DEFAULT_WHEEL_PRIZES],
      spinCost: 5
    }
  };
};

export const mockData: Record<string, any[]> = loadMockData();

let history: string[] = [];

type Listener = () => void;
const mockListeners: Listener[] = [];
const notifyMockListeners = () => mockListeners.forEach(l => l());
export const subscribeToMockData = (listener: Listener) => {
  mockListeners.push(listener);
  return () => {
    const idx = mockListeners.indexOf(listener);
    if (idx > -1) mockListeners.splice(idx, 1);
  };
};

export const saveMockData = () => {
  if (isMockMode) {
    history.push(JSON.stringify(mockData));
    if (history.length > 20) history.shift(); // Keep last 20 states
    localStorage.setItem('mockData', JSON.stringify(mockData));
    notifyMockListeners();
  }
};

export const undoLastAction = () => {
  if (history.length > 1) { // Need at least 2 states to undo (current and previous)
    history.pop(); // Remove current state
    const previousState = history[history.length - 1];
    Object.assign(mockData, JSON.parse(previousState));
    localStorage.setItem('mockData', JSON.stringify(mockData));
    notifyMockListeners();
    return true;
  }
  return false;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export const getUser = async (uid: string) => {
  const normalizedUid = uid.toLowerCase().trim();
  if (isMockMode) {
    return mockData.users.find(u => u.id === normalizedUid || u.email === normalizedUid) || null;
  }
  
  // 1. Try direct ID lookup
  const docSnap = await getDoc(doc(db, "users", normalizedUid));
  if (docSnap.exists()) {
    return Object.assign({ id: docSnap.id }, docSnap.data());
  }
  
  // 2. Fallback: search by email (case-insensitive)
  const q = query(collection(db, "users"), where("email", "==", normalizedUid));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
  }
  
  return null;
};

export const getAssignments = async () => {
  if (isMockMode) return [...mockData.assignments];
  const q = query(collection(db, "assignments"), orderBy("dueDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
};

export const subscribeToAssignments = (callback: (data: any[]) => void) => {
  if (isMockMode) {
    callback([...mockData.assignments]);
    return subscribeToMockData(() => callback([...mockData.assignments]));
  }
  const q = query(collection(db, "assignments"), orderBy("dueDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => Object.assign({ id: d.id }, d.data())));
  });
};

export const getAssignment = async (id: string) => {
  if (isMockMode) return mockData.assignments.find(a => a.id === id) || null;
  const docSnap = await getDoc(doc(db, "assignments", id));
  return docSnap.exists() ? Object.assign({ id: docSnap.id }, docSnap.data()) : null;
};

export const createAssignment = async (data: any) => {
  if (isMockMode) {
    const newAssignment = { id: generateId(), ...data };
    mockData.assignments.push(newAssignment);
    saveMockData();
    return newAssignment;
  }
  const docRef = await addDoc(collection(db, "assignments"), data);
  return { id: docRef.id, ...data };
};

export const getSubmissions = async (assignmentId?: string, studentId?: string) => {
  if (isMockMode) {
    let subs = [...mockData.submissions];
    if (assignmentId) subs = subs.filter(s => s.assignmentId === assignmentId);
    if (studentId) subs = subs.filter(s => s.studentId === studentId);
    return subs;
  }
  let q = collection(db, "submissions") as any;
  if (assignmentId) q = query(q, where("assignmentId", "==", assignmentId));
  if (studentId) q = query(q, where("studentId", "==", studentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
};

export const subscribeToSubmissions = (callback: (data: any[]) => void, assignmentId?: string, studentId?: string) => {
  if (isMockMode) {
    const getFiltered = () => {
      let subs = [...mockData.submissions];
      if (assignmentId) subs = subs.filter(s => s.assignmentId === assignmentId);
      if (studentId) subs = subs.filter(s => s.studentId === studentId);
      return subs;
    };
    callback(getFiltered());
    return subscribeToMockData(() => callback(getFiltered()));
  }
  let q = collection(db, "submissions") as any;
  if (assignmentId) q = query(q, where("assignmentId", "==", assignmentId));
  if (studentId) q = query(q, where("studentId", "==", studentId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => Object.assign({ id: d.id }, d.data())));
  });
};

export const submitAssignment = async (data: any) => {
  if (isMockMode) {
    const existingSub = mockData.submissions.find(s => s.assignmentId === data.assignmentId && s.studentId === data.studentId);
    if (existingSub) {
      Object.assign(existingSub, { ...data, status: "submitted", submittedAt: new Date().toISOString() });
      saveMockData();
      return existingSub;
    }
    const newSub = { id: generateId(), ...data, status: "submitted", submittedAt: new Date().toISOString() };
    mockData.submissions.push(newSub);
    saveMockData();
    return newSub;
  }
  
  const q = query(collection(db, "submissions"), where("assignmentId", "==", data.assignmentId), where("studentId", "==", data.studentId));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    await updateDoc(docRef, { ...data, status: "submitted", submittedAt: new Date().toISOString() });
    return { id: docRef.id, ...data };
  }
  
  const docRef = await addDoc(collection(db, "submissions"), { ...data, status: "submitted", submittedAt: new Date().toISOString() });
  return { id: docRef.id, ...data };
};

export const gradeSubmission = async (submissionId: string, data: any) => {
  if (isMockMode) {
    const sub = mockData.submissions.find(s => s.id === submissionId);
    if (sub) {
      Object.assign(sub, { ...(data || {}), status: "graded" });
      saveMockData();
    }
    return sub;
  }
  await updateDoc(doc(db, "submissions", submissionId), { ...(data || {}), status: "graded" });
};

export const updateSubmission = async (submissionId: string, data: any) => {
  if (isMockMode) {
    const sub = mockData.submissions.find(s => s.id === submissionId);
    if (sub) {
      Object.assign(sub, data);
      saveMockData();
    }
    return sub;
  }
  await updateDoc(doc(db, "submissions", submissionId), data);
};

export const getBadges = async (studentId: string) => {
  if (isMockMode) return mockData.badges.filter(b => b.studentId === studentId);
  const q = query(collection(db, "badges"), where("studentId", "==", studentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
};

export const subscribeToBadges = (callback: (data: any[]) => void, studentId?: string) => {
  if (isMockMode) {
    const getFiltered = () => studentId ? mockData.badges.filter(b => b.studentId === studentId) : [...(mockData.badges || [])];
    callback(getFiltered());
    return subscribeToMockData(() => callback(getFiltered()));
  }
  const q = studentId 
    ? query(collection(db, "badges"), where("studentId", "==", studentId))
    : collection(db, "badges");
  return onSnapshot(q as any, (snapshot) => {
    callback(snapshot.docs.map(d => Object.assign({ id: d.id }, d.data())));
  });
};

export const addBadge = async (data: any) => {
  if (isMockMode) {
    const newBadge = { id: generateId(), ...data };
    mockData.badges.push(newBadge);
    saveMockData();
    return newBadge;
  }
  const docRef = await addDoc(collection(db, "badges"), data);
  return { id: docRef.id, ...data };
};

export const getStudents = async () => {
  if (isMockMode) return mockData.users.filter(u => u.role === "student");
  const q = query(collection(db, "users"), where("role", "==", "student"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
};

export const subscribeToStudents = (callback: (data: any[]) => void) => {
  if (isMockMode) {
    const getFiltered = () => mockData.users.filter(u => u.role === "student");
    callback(getFiltered());
    return subscribeToMockData(() => callback(getFiltered()));
  }
  const q = query(collection(db, "users"), where("role", "==", "student"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => Object.assign({ id: d.id }, d.data())));
  });
};

export const getTeachers = async () => {
  if (isMockMode) return mockData.users.filter(u => u.role === "teacher");
  const q = query(collection(db, "users"), where("role", "==", "teacher"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
};

export const subscribeToTeachers = (callback: (data: any[]) => void) => {
  if (isMockMode) {
    const getFiltered = () => mockData.users.filter(u => u.role === "teacher");
    callback(getFiltered());
    return subscribeToMockData(() => callback(getFiltered()));
  }
  const q = query(collection(db, "users"), where("role", "==", "teacher"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => Object.assign({ id: d.id }, d.data())));
  });
};

const cleanUserData = (data: any) => {
  const cleaned = { ...data };
  if (cleaned.email) {
    cleaned.email = cleaned.email.toLowerCase();
  } else if ('email' in cleaned) {
    delete cleaned.email;
  }
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

export const addStudent = async (data: any) => {
  if (isMockMode) {
    const id = (data.username || generateId()).toLowerCase();
    if (mockData.users.some(u => u.id === id)) {
      throw new Error("Username already exists");
    }
    const newStudent = { id, role: "student", ...data };
    mockData.users.push(newStudent);
    saveMockData();
    return newStudent;
  }
  const id = (data.username || generateId()).toLowerCase();
  const docRef = doc(db, "users", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) throw new Error("Username already exists");
  await setDoc(docRef, { role: "student", ...cleanUserData(data) });
  return { id, ...data };
};

export const addTeacher = async (data: any) => {
  if (isMockMode) {
    const id = (data.username || generateId()).toLowerCase();
    if (mockData.users.some(u => u.id === id)) {
      throw new Error("Username already exists");
    }
    const newTeacher = { id, role: "teacher", ...data };
    mockData.users.push(newTeacher);
    saveMockData();
    return newTeacher;
  }
  const id = (data.username || generateId()).toLowerCase();
  const docRef = doc(db, "users", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) throw new Error("Username already exists");
  await setDoc(docRef, { role: "teacher", ...cleanUserData(data) });
  return { id, ...data };
};

export const updateStudent = async (id: string, data: any) => {
  const normalizedId = id.toLowerCase();
  const normalizedNewId = data.id?.toLowerCase();
  
  if (isMockMode) {
    const index = mockData.users.findIndex(u => u.id === normalizedId);
    if (index > -1) {
      if (normalizedNewId && normalizedNewId !== normalizedId) {
        const existing = mockData.users.find(u => u.id === normalizedNewId);
        if (existing) throw new Error("Username already exists");
      }
      Object.assign(mockData.users[index], { ...data, id: normalizedNewId || normalizedId, email: data.email?.toLowerCase() });
      saveMockData();
      return mockData.users[index];
    }
    return null;
  }
  
  const cleanedData = cleanUserData(data);
  if (normalizedNewId && normalizedNewId !== normalizedId) {
    const newDocRef = doc(db, "users", normalizedNewId);
    const newDocSnap = await getDoc(newDocRef);
    if (newDocSnap.exists()) throw new Error("Username already exists");
    const oldDocRef = doc(db, "users", normalizedId);
    const oldDocSnap = await getDoc(oldDocRef);
    if (oldDocSnap.exists()) {
      await setDoc(newDocRef, { ...oldDocSnap.data(), ...cleanedData, id: normalizedNewId });
      await deleteDoc(oldDocRef);
    }
  } else {
    await updateDoc(doc(db, "users", normalizedId), cleanedData);
  }
};

export const updateTeacher = async (id: string, data: any) => {
  const normalizedId = id.toLowerCase();
  const normalizedNewId = data.id?.toLowerCase();

  if (isMockMode) {
    const index = mockData.users.findIndex(u => u.id === normalizedId);
    if (index > -1) {
      if (normalizedNewId && normalizedNewId !== normalizedId) {
        const existing = mockData.users.find(u => u.id === normalizedNewId);
        if (existing) throw new Error("Username already exists");
      }
      Object.assign(mockData.users[index], { ...data, id: normalizedNewId || normalizedId, email: data.email?.toLowerCase() });
      saveMockData();
      return mockData.users[index];
    }
    return null;
  }
  
  const cleanedData = cleanUserData(data);
  if (normalizedNewId && normalizedNewId !== normalizedId) {
    const newDocRef = doc(db, "users", normalizedNewId);
    const newDocSnap = await getDoc(newDocRef);
    if (newDocSnap.exists()) throw new Error("Username already exists");
    const oldDocRef = doc(db, "users", normalizedId);
    const oldDocSnap = await getDoc(oldDocRef);
    if (oldDocSnap.exists()) {
      await setDoc(newDocRef, { ...oldDocSnap.data(), ...cleanedData, id: normalizedNewId });
      await deleteDoc(oldDocRef);
    }
  } else {
    await updateDoc(doc(db, "users", normalizedId), cleanedData);
  }
};

export const deleteStudent = async (id: string) => {
  if (isMockMode) {
    mockData.users = mockData.users.filter(u => u.id !== id);
    saveMockData();
    return;
  }
  await deleteDoc(doc(db, "users", id));
};

export const deleteTeacher = async (id: string) => {
  if (isMockMode) {
    mockData.users = mockData.users.filter(u => u.id !== id);
    saveMockData();
    return;
  }
  await deleteDoc(doc(db, "users", id));
};

export const updateAssignment = async (id: string, data: any) => {
  if (isMockMode) {
    const index = mockData.assignments.findIndex(a => a.id === id);
    if (index > -1) {
      Object.assign(mockData.assignments[index], data);
      saveMockData();
      return mockData.assignments[index];
    }
    return null;
  }
  await updateDoc(doc(db, "assignments", id), data);
};

export const deleteAssignment = async (id: string) => {
  if (isMockMode) {
    mockData.assignments = mockData.assignments.filter(a => a.id !== id);
    mockData.submissions = mockData.submissions.filter(s => s.assignmentId !== id);
    saveMockData();
    return;
  }
  const q = query(collection(db, "submissions"), where("assignmentId", "==", id));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
  await Promise.all([...deletePromises, deleteDoc(doc(db, "assignments", id))]);
};

export const resetApp = async () => {
  if (isMockMode) {
    mockData.assignments = [];
    mockData.submissions = [];
    mockData.badges = [];
    mockData.posts = [];
    mockData.notifications = [];
    mockData.attendance = [];
    mockData.evaluations = [];
    // Reset spinsUsed for all students
    mockData.users.forEach(u => {
      if (u.role === "student") {
        u.spinsUsed = 0;
      }
    });
    saveMockData();
    return;
  }
  const collections = ["assignments", "submissions", "badges", "posts", "notifications", "attendance", "evaluations"];
  for (const collName of collections) {
    const snapshot = await getDocs(collection(db, collName));
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  }
  const studentsSnapshot = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
  const updatePromises = studentsSnapshot.docs.map(d => updateDoc(d.ref, { spinsUsed: 0 }));
  await Promise.all(updatePromises);
};

export const getPosts = async () => {
  if (isMockMode) return [...mockData.posts];
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
};

export const subscribeToPosts = (callback: (data: any[]) => void) => {
  if (isMockMode) {
    callback([...mockData.posts]);
    return subscribeToMockData(() => callback([...mockData.posts]));
  }
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => Object.assign({ id: d.id }, d.data())));
  });
};

export const createPost = async (data: any) => {
  if (isMockMode) {
    const newPost = { id: generateId(), createdAt: new Date().toISOString(), ...data };
    mockData.posts.unshift(newPost);
    saveMockData();
    return newPost;
  }
  const docRef = await addDoc(collection(db, "posts"), { ...data, createdAt: new Date().toISOString() });
  return { id: docRef.id, ...data };
};

export const deletePost = async (id: string) => {
  if (isMockMode) {
    mockData.posts = mockData.posts.filter(p => p.id !== id);
    saveMockData();
    return;
  }
  await deleteDoc(doc(db, "posts", id));
};

export const updatePost = async (id: string, data: any) => {
  if (isMockMode) {
    const idx = mockData.posts.findIndex(p => p.id === id);
    if (idx > -1) {
      mockData.posts[idx] = { ...mockData.posts[idx], ...data };
      saveMockData();
      return mockData.posts[idx];
    }
    return null;
  }
  await updateDoc(doc(db, "posts", id), data);
  return { id, ...data };
};

export const getAppSettings = async () => {
  if (isMockMode) return mockData.appSettings || {};
  const docSnap = await getDoc(doc(db, "settings", "app"));
  return docSnap.exists() ? docSnap.data() : {};
};

export const subscribeToAppSettings = (callback: (data: any) => void) => {
  if (isMockMode) {
    callback(mockData.appSettings || {});
    return subscribeToMockData(() => callback(mockData.appSettings || {}));
  }
  return onSnapshot(doc(db, "settings", "app"), (docSnap) => {
    callback(docSnap.exists() ? docSnap.data() : {});
  });
};

export const updateAppSettings = async (data: any) => {
  if (isMockMode) {
    mockData.appSettings = { ...mockData.appSettings, ...data };
    saveMockData();
    return mockData.appSettings;
  }
  await setDoc(doc(db, "settings", "app"), data, { merge: true });
  return data;
};

export const createNotification = async (data: any) => {
  const payload = {
    ...data,
    read: false,
    createdAt: new Date().toISOString()
  };
  if (isMockMode) {
    const newNotif = { id: generateId(), ...payload };
    if (!mockData.notifications) mockData.notifications = [];
    mockData.notifications.unshift(newNotif);
    saveMockData();
    return newNotif;
  }
  const docRef = await addDoc(collection(db, "notifications"), payload);
  return { id: docRef.id, ...payload };
};

export const subscribeToNotifications = (callback: (data: any[]) => void) => {
  if (isMockMode) {
    const getList = () => [...(mockData.notifications || [])];
    callback(getList());
    return subscribeToMockData(() => callback(getList()));
  }
  const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => Object.assign({ id: d.id }, d.data())));
  }, (err) => {
    console.error("Notifications snapshot error, falling back:", err);
    getDocs(collection(db, "notifications")).then(snap => {
      const list = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
      list.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(list);
    }).catch(e => console.error("Notification fallback fetch error:", e));
  });
};

export const markNotificationAsRead = async (id: string) => {
  if (isMockMode) {
    const notif = mockData.notifications?.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      saveMockData();
    }
    return;
  }
  await updateDoc(doc(db, "notifications", id), { read: true });
};

export const markAllNotificationsAsRead = async () => {
  if (isMockMode) {
    mockData.notifications?.forEach(n => { n.read = true; });
    saveMockData();
    return;
  }
  const q = query(collection(db, "notifications"), where("read", "==", false));
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map(d => updateDoc(d.ref, { read: true }));
  await Promise.all(promises);
};

export const deleteNotification = async (id: string) => {
  if (isMockMode) {
    if (mockData.notifications) {
      mockData.notifications = mockData.notifications.filter(n => n.id !== id);
      saveMockData();
    }
    return;
  }
  await deleteDoc(doc(db, "notifications", id));
};

export const clearAllNotifications = async () => {
  if (isMockMode) {
    mockData.notifications = [];
    saveMockData();
    return;
  }
  const snapshot = await getDocs(collection(db, "notifications"));
  const promises = snapshot.docs.map(d => deleteDoc(d.ref));
  await Promise.all(promises);
};

// ==================== ATTENDANCE (ĐIỂM DANH HÀNG NGÀY) ====================

export interface AttendanceRecord {
  id?: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: 'present' | 'excused' | 'unexcused' | 'late'; // Có mặt, Vắng có phép, Vắng không phép, Đi muộn
  note?: string;
  updatedAt: string;
  teacherName?: string;
}

export const saveAttendanceBatch = async (
  date: string,
  records: Array<{ studentId: string; status: 'present' | 'excused' | 'unexcused' | 'late'; note?: string }>,
  teacherName: string = "Giáo viên"
) => {
  const timestamp = new Date().toISOString();

  if (isMockMode) {
    if (!mockData.attendance) mockData.attendance = [];
    records.forEach(r => {
      const existingIdx = mockData.attendance.findIndex(
        (a: any) => a.date === date && a.studentId === r.studentId
      );
      const recordData: AttendanceRecord = {
        id: `${date}_${r.studentId}`,
        date,
        studentId: r.studentId,
        status: r.status,
        note: r.note || "",
        updatedAt: timestamp,
        teacherName
      };

      if (existingIdx >= 0) {
        mockData.attendance[existingIdx] = recordData;
      } else {
        mockData.attendance.push(recordData);
      }
    });
    saveMockData();
    return mockData.attendance.filter((a: any) => a.date === date);
  }

  // Real Firestore: save each student's attendance with doc ID `${date}_${studentId}`
  const promises = records.map(async (r) => {
    const docId = `${date}_${r.studentId}`;
    const recordData: AttendanceRecord = {
      date,
      studentId: r.studentId,
      status: r.status,
      note: r.note || "",
      updatedAt: timestamp,
      teacherName
    };
    await setDoc(doc(db, "attendance", docId), recordData, { merge: true });
    return { id: docId, ...recordData };
  });

  return await Promise.all(promises);
};

export const subscribeToAttendance = (callback: (data: AttendanceRecord[]) => void) => {
  if (isMockMode) {
    const getList = () => [...(mockData.attendance || [])];
    callback(getList());
    return subscribeToMockData(() => callback(getList()));
  }

  return onSnapshot(collection(db, "attendance"), (snapshot) => {
    callback(snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()) as AttendanceRecord));
  }, (err) => {
    console.error("Attendance listener error:", err);
    getDocs(collection(db, "attendance")).then(snap => {
      callback(snap.docs.map(d => Object.assign({ id: d.id }, d.data()) as AttendanceRecord));
    }).catch(e => console.error("Attendance fallback error:", e));
  });
};

export const subscribeToAttendanceByDate = (date: string, callback: (data: AttendanceRecord[]) => void) => {
  if (isMockMode) {
    const getFiltered = () => (mockData.attendance || []).filter((a: any) => a.date === date);
    callback(getFiltered());
    return subscribeToMockData(() => callback(getFiltered()));
  }

  const q = query(collection(db, "attendance"), where("date", "==", date));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()) as AttendanceRecord));
  }, (err) => {
    console.error("Attendance date listener error:", err);
    getDocs(q).then(snap => {
      callback(snap.docs.map(d => Object.assign({ id: d.id }, d.data()) as AttendanceRecord));
    }).catch(e => console.error("Attendance date fallback error:", e));
  });
};

// ==================== EVALUATIONS (ĐÁNH GIÁ ĐỊNH KỲ) ====================

export interface EvaluationRecord {
  id?: string;
  studentId: string;
  studentName?: string;
  period: 'daily' | 'weekly' | 'monthly'; // Cuối ngày, Cuối tuần, Cuối tháng
  date: string; // YYYY-MM-DD or YYYY-MM or YYYY-Www
  periodLabel: string; // "Ngày 06/10/2026", "Tuần 1 - Tháng 10/2026", "Tháng 10/2026"
  overallRating: 'Tốt' | 'Đạt' | 'Cần cố gắng';
  academicEffort: string; // Ý thức học tập
  discipline: string; // Kỷ luật & nề nếp
  teamwork: string; // Đoàn kết & giúp đỡ bạn bè
  comment: string; // Nhận xét của giáo viên
  teacherName: string;
  createdAt: string;
}

export const saveEvaluation = async (data: Omit<EvaluationRecord, 'id' | 'createdAt'> & { id?: string }) => {
  const timestamp = new Date().toISOString();
  const payload = {
    ...data,
    createdAt: timestamp
  };

  if (isMockMode) {
    if (!mockData.evaluations) mockData.evaluations = [];
    if (data.id) {
      const idx = mockData.evaluations.findIndex((e: any) => e.id === data.id);
      if (idx >= 0) {
        mockData.evaluations[idx] = { ...mockData.evaluations[idx], ...payload };
        saveMockData();
        return mockData.evaluations[idx];
      }
    }
    const newEval = { id: generateId(), ...payload };
    mockData.evaluations.unshift(newEval);
    saveMockData();
    return newEval;
  }

  if (data.id) {
    await updateDoc(doc(db, "evaluations", data.id), payload);
    return { id: data.id, ...payload };
  } else {
    const docRef = await addDoc(collection(db, "evaluations"), payload);
    return { id: docRef.id, ...payload };
  }
};

export const deleteEvaluation = async (id: string) => {
  if (isMockMode) {
    if (mockData.evaluations) {
      mockData.evaluations = mockData.evaluations.filter((e: any) => e.id !== id);
      saveMockData();
    }
    return;
  }
  await deleteDoc(doc(db, "evaluations", id));
};

export const subscribeToEvaluations = (
  callback: (data: EvaluationRecord[]) => void,
  studentId?: string
) => {
  if (isMockMode) {
    const getList = () => {
      let list = [...(mockData.evaluations || [])];
      if (studentId) list = list.filter((e: any) => e.studentId === studentId);
      return list;
    };
    callback(getList());
    return subscribeToMockData(() => callback(getList()));
  }

  let q = collection(db, "evaluations") as any;
  if (studentId) {
    q = query(q, where("studentId", "==", studentId));
  }

  return onSnapshot(q, (snapshot: any) => {
    const list = snapshot.docs.map((d: any) => Object.assign({ id: d.id }, d.data()) as EvaluationRecord);
    list.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(list);
  }, (err: any) => {
    console.error("Evaluations listener error:", err);
    getDocs(q).then((snap: any) => {
      const list = snap.docs.map((d: any) => Object.assign({ id: d.id }, d.data()) as EvaluationRecord);
      list.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(list);
    }).catch((e: any) => console.error("Evaluations fallback error:", e));
  });
};


