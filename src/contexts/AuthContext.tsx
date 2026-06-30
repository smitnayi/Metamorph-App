import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, loginWithGoogle, logoutUser, loginWithEmail, signupWithEmail, db, handleRedirectLogin } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export interface AuthUser {
  id: string; // matches uid
  uid: string;
  name: string;
  email: string;
  roleId: string;
  status?: 'Active' | 'Inactive';
}

interface AuthContextType {
  currentUser: AuthUser | null;
  login: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  signupEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Process any pending redirect logins for mobile
    handleRedirectLogin().catch(console.error);

    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }

      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        
        // Listen to Firestore document for real-time updates (especially useful for status/role changes or name updates)
        unsubscribeSnapshot = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            let finalRoleId = data.roleId || "role-employee";
            let finalStatus = data.status || "Inactive";
            
            // Auto-admin for specific email
            if (firebaseUser.email === "nayismit3140@gmail.com") {
              if (data.roleId !== "role-admin" || data.status !== "Active") {
                 await setDoc(userRef, { ...data, roleId: "role-admin", status: "Active" });
                 // The snapshot will trigger again with the new data
                 return;
              }
              finalRoleId = "role-admin";
              finalStatus = "Active";
            }
            
            setCurrentUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || "Unknown Operator",
              email: data.email || firebaseUser.email || "",
              roleId: finalRoleId,
              status: finalStatus as any
            });
            setIsLoading(false);
          } else {
            // Document doesn't exist yet (might be racing with processAuthResult).
            // We set a temporary user until processAuthResult creates the document and triggers the snapshot.
            if (firebaseUser.email === "nayismit3140@gmail.com") {
              setCurrentUser({
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || "Admin",
                email: firebaseUser.email || "",
                roleId: "role-admin",
                status: "Active"
              });
            } else {
              setCurrentUser({
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || "Loading...",
                email: firebaseUser.email || "",
                roleId: "role-employee",
                status: "Inactive"
              });
            }
            setIsLoading(false);
          }
        }, (error) => {
          console.error("Error listening to user profile", error);
          setIsLoading(false);
        });
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
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

  const signupEmail = async (email: string, pass: string, name: string) => {
    try {
      await signupWithEmail(email, pass, name);
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
