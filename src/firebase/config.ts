import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDtB2bWSr42anF_9jsK_YovhiekPRHnofU",
  authDomain: "quanlyhocsinh-l3.firebaseapp.com",
  projectId: "quanlyhocsinh-l3",
  storageBucket: "quanlyhocsinh-l3.firebasestorage.app",
  messagingSenderId: "962661661065",
  appId: "1:962661661065:web:660c39893b0e4f0b46c958",
  measurementId: "G-FNYFSCGP8Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Flag to check if we are using mock mode (no real config provided)
export const isMockMode = false;
