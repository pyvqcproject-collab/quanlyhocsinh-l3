import { db, isMockMode } from "./config";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";

// Mock Data Store
const loadMockData = () => {
  const saved = localStorage.getItem('mockData');
  if (saved) return JSON.parse(saved);
  return {
    users: [
      { id: "teacher-1", email: "teacher@school.com", role: "teacher", name: "Cô Lan", password: "123456", isAdmin: true }
    ],
    assignments: [],
    submissions: [],
    badges: [],
    posts: [],
    appSettings: {
      teacherName: "Cô Lan",
      schoolName: "Trường Tiểu học ABC",
      className: "Lớp 3A",
      avatarUrl: "",
      appName: "Ứng dụng Quản lý Lớp học"
    }
  };
};

export const mockData: Record<string, any[]> = loadMockData();

let history: string[] = [];

export const saveMockData = () => {
  if (isMockMode) {
    history.push(JSON.stringify(mockData));
    if (history.length > 20) history.shift(); // Keep last 20 states
    localStorage.setItem('mockData', JSON.stringify(mockData));
  }
};

export const undoLastAction = () => {
  if (history.length > 1) { // Need at least 2 states to undo (current and previous)
    history.pop(); // Remove current state
    const previousState = history[history.length - 1];
    Object.assign(mockData, JSON.parse(previousState));
    localStorage.setItem('mockData', JSON.stringify(mockData));
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

export const submitAssignment = async (data: any) => {
  if (isMockMode) {
    const newSub = { id: generateId(), ...data, status: "submitted", submittedAt: new Date().toISOString() };
    mockData.submissions.push(newSub);
    saveMockData();
    return newSub;
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

export const getBadges = async (studentId: string) => {
  if (isMockMode) return mockData.badges.filter(b => b.studentId === studentId);
  const q = query(collection(db, "badges"), where("studentId", "==", studentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
};

export const getStudents = async () => {
  if (isMockMode) return mockData.users.filter(u => u.role === "student");
  const q = query(collection(db, "users"), where("role", "==", "student"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
};

export const getTeachers = async () => {
  if (isMockMode) return mockData.users.filter(u => u.role === "teacher");
  const q = query(collection(db, "users"), where("role", "==", "teacher"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
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
  await setDoc(docRef, { role: "student", ...data, email: data.email?.toLowerCase() });
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
  await setDoc(docRef, { role: "teacher", ...data, email: data.email?.toLowerCase() });
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
  if (normalizedNewId && normalizedNewId !== normalizedId) {
    const newDocRef = doc(db, "users", normalizedNewId);
    const newDocSnap = await getDoc(newDocRef);
    if (newDocSnap.exists()) throw new Error("Username already exists");
    const oldDocRef = doc(db, "users", normalizedId);
    const oldDocSnap = await getDoc(oldDocRef);
    if (oldDocSnap.exists()) {
      await setDoc(newDocRef, { ...oldDocSnap.data(), ...data, id: normalizedNewId, email: data.email?.toLowerCase() });
      await deleteDoc(oldDocRef);
    }
  } else {
    await updateDoc(doc(db, "users", normalizedId), { ...data, email: data.email?.toLowerCase() });
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
  if (normalizedNewId && normalizedNewId !== normalizedId) {
    const newDocRef = doc(db, "users", normalizedNewId);
    const newDocSnap = await getDoc(newDocRef);
    if (newDocSnap.exists()) throw new Error("Username already exists");
    const oldDocRef = doc(db, "users", normalizedId);
    const oldDocSnap = await getDoc(oldDocRef);
    if (oldDocSnap.exists()) {
      await setDoc(newDocRef, { ...oldDocSnap.data(), ...data, id: normalizedNewId, email: data.email?.toLowerCase() });
      await deleteDoc(oldDocRef);
    }
  } else {
    await updateDoc(doc(db, "users", normalizedId), { ...data, email: data.email?.toLowerCase() });
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
    saveMockData();
    return;
  }
  await deleteDoc(doc(db, "assignments", id));
};

export const getPosts = async () => {
  if (isMockMode) return [...mockData.posts];
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
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

export const updateAppSettings = async (data: any) => {
  if (isMockMode) {
    mockData.appSettings = { ...mockData.appSettings, ...data };
    saveMockData();
    return mockData.appSettings;
  }
  await setDoc(doc(db, "settings", "app"), data, { merge: true });
  return data;
};
