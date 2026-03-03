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
  if (isMockMode) {
    return mockData.users.find(u => u.id === uid || u.email === uid) || null;
  }
  const docSnap = await getDoc(doc(db, "users", uid));
  return docSnap.exists() ? Object.assign({ id: docSnap.id }, docSnap.data()) : null;
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
    const id = data.username || generateId();
    if (mockData.users.some(u => u.id === id)) {
      throw new Error("Username already exists");
    }
    const newStudent = { id, role: "student", ...data };
    mockData.users.push(newStudent);
    saveMockData();
    return newStudent;
  }
  const id = data.username || generateId();
  const docRef = doc(db, "users", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) throw new Error("Username already exists");
  await setDoc(docRef, { role: "student", ...data });
  return { id, ...data };
};

export const addTeacher = async (data: any) => {
  if (isMockMode) {
    const id = data.username || generateId();
    if (mockData.users.some(u => u.id === id)) {
      throw new Error("Username already exists");
    }
    const newTeacher = { id, role: "teacher", ...data };
    mockData.users.push(newTeacher);
    saveMockData();
    return newTeacher;
  }
  const id = data.username || generateId();
  const docRef = doc(db, "users", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) throw new Error("Username already exists");
  await setDoc(docRef, { role: "teacher", ...data });
  return { id, ...data };
};

export const updateStudent = async (id: string, data: any) => {
  if (isMockMode) {
    const index = mockData.users.findIndex(u => u.id === id);
    if (index > -1) {
      if (data.id && data.id !== id) {
        const existing = mockData.users.find(u => u.id === data.id);
        if (existing) throw new Error("Username already exists");
      }
      Object.assign(mockData.users[index], data);
      saveMockData();
      return mockData.users[index];
    }
    return null;
  }
  if (data.id && data.id !== id) {
    const newDocRef = doc(db, "users", data.id);
    const newDocSnap = await getDoc(newDocRef);
    if (newDocSnap.exists()) throw new Error("Username already exists");
    const oldDocRef = doc(db, "users", id);
    const oldDocSnap = await getDoc(oldDocRef);
    if (oldDocSnap.exists()) {
      await setDoc(newDocRef, { ...oldDocSnap.data(), ...data });
      await deleteDoc(oldDocRef);
    }
  } else {
    await updateDoc(doc(db, "users", id), data);
  }
};

export const updateTeacher = async (id: string, data: any) => {
  if (isMockMode) {
    const index = mockData.users.findIndex(u => u.id === id);
    if (index > -1) {
      if (data.id && data.id !== id) {
        // If ID is changing, we need to ensure it doesn't conflict
        const existing = mockData.users.find(u => u.id === data.id);
        if (existing) throw new Error("Username already exists");
      }
      Object.assign(mockData.users[index], data);
      saveMockData();
      return mockData.users[index];
    }
    return null;
  }
  if (data.id && data.id !== id) {
    const newDocRef = doc(db, "users", data.id);
    const newDocSnap = await getDoc(newDocRef);
    if (newDocSnap.exists()) throw new Error("Username already exists");
    const oldDocRef = doc(db, "users", id);
    const oldDocSnap = await getDoc(oldDocRef);
    if (oldDocSnap.exists()) {
      await setDoc(newDocRef, { ...oldDocSnap.data(), ...data });
      await deleteDoc(oldDocRef);
    }
  } else {
    await updateDoc(doc(db, "users", id), data);
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
