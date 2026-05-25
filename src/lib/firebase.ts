/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in the database
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    let roleId = 'role-employee';

    if (!userSnap.exists()) {
      // Create new user defaulted to Employee
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || 'Unknown Operator',
        email: user.email || '',
        roleId: roleId
      });
    }
    
    return user;
  } catch (error: any) {
    console.error("Firebase Auth Error", error);
    toast.error(error.message || "Failed to log in");
    throw error;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const user = result.user;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let roleId = 'role-employee';

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || email.split('@')[0],
        email: user.email || '',
        roleId: roleId
      });
    }

    return user;
  } catch (error: any) {
    console.error("Firebase Email Auth Error", error);
    toast.error(error.message || "Failed to log in");
    throw error;
  }
}

export async function signupWithEmail(email: string, pass: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;

    const userRef = doc(db, 'users', user.uid);
    
    let roleId = 'role-employee';

    await setDoc(userRef, {
      uid: user.uid,
      name: email.split('@')[0],
      email: user.email || '',
      roleId: roleId
    });

    return user;
  } catch (error: any) {
    console.error("Firebase Email Auth Error", error);
    toast.error(error.message || "Failed to sign up");
    throw error;
  }
}
