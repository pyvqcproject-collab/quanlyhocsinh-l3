import { auth, isMockMode } from "./config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { mockData } from "./db";

// Mock state
let mockUser: any = null;
const mockListeners: any[] = [];

export const login = async (email: string, password: string, role: string) => {
  if (isMockMode) {
    if (role === 'parent') {
      const studentUsername = email.split('@')[0].replace(/^PH/i, 'HS');
      const student = mockData.users.find(u => u.email === `${studentUsername}@school.com`);
      if (student) {
        mockUser = { id: `parent-${student.id}`, email, role: 'parent', name: `Phụ huynh ${student.name}`, studentId: student.id };
        mockListeners.forEach(l => l(mockUser));
        return mockUser;
      }
    } else {
      const user = mockData.users.find(u => u.email === email && u.password === password && u.role === role);
      if (user) {
        mockUser = user;
        mockListeners.forEach(l => l(mockUser));
        return mockUser;
      }
    }
    throw new Error("Invalid credentials");
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const register = async (email: string, password: string) => {
  if (isMockMode) {
    mockUser = { uid: "mock-uid-" + Date.now(), email, role: "student" };
    mockListeners.forEach(l => l(mockUser));
    return mockUser;
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logout = async () => {
  if (isMockMode) {
    mockUser = null;
    mockListeners.forEach(l => l(null));
    return;
  }
  return signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: any) => void) => {
  if (isMockMode) {
    mockListeners.push(callback);
    callback(mockUser);
    return () => {
      const index = mockListeners.indexOf(callback);
      if (index > -1) mockListeners.splice(index, 1);
    };
  }
  return onAuthStateChanged(auth, callback);
};
