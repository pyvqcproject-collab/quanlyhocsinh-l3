import React, { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuthChanges } from "../firebase/auth";
import { getUser } from "../firebase/db";

interface AuthContextType {
  user: any;
  loading: boolean;
  setUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, setUser: () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from DB
        const profile = await getUser(firebaseUser.email || firebaseUser.uid);
        setUser({ ...firebaseUser, ...profile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
