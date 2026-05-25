import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, loginWithGoogle, logoutUser, loginWithEmail, signupWithEmail, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface AuthUser {
  id: string; // matches uid
  uid: string;
  name: string;
  email: string;
  roleId: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  login: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  signupEmail: (email: string, pass: string) => Promise<void>;
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
          
          let finalRoleId = "role-employee";

          if (userSnap.exists()) {
            finalRoleId = userSnap.data().roleId || finalRoleId;
          }

          if (userSnap.exists()) {
            const data = userSnap.data();
            setCurrentUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || "Unknown",
              email: data.email || firebaseUser.email || "",
              roleId: finalRoleId
            });
          } else {
             setCurrentUser({
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || "Unknown",
                email: firebaseUser.email || "",
                roleId: finalRoleId
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
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const loginEmail = async (email: string, pass: string) => {
    try {
      await loginWithEmail(email, pass);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const signupEmail = async (email: string, pass: string) => {
    try {
      await signupWithEmail(email, pass);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const logout = async () => {
    await logoutUser();
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, loginEmail, signupEmail, logout, isLoading }}>
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
