import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, loginWithGoogle, logoutUser, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type Role = "Admin" | "Manager" | "Operator";

export interface AuthUser {
  id: string; // matches uid
  uid: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            setCurrentUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: data.name,
              email: data.email,
              role: data.role as Role
            });
          } else {
             setCurrentUser({
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || "Unknown",
                email: firebaseUser.email || "",
                role: "Operator"
             });
          }
        } catch (e) {
          console.error("Error fetching user profile", e);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setIsLoading(true);
    await loginWithGoogle();
  };

  const logout = async () => {
    await logoutUser();
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
