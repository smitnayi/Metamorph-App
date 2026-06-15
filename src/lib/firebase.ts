/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithCredential, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { toast } from 'sonner';

import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    if (Capacitor.isNativePlatform()) {
       const result = await FirebaseAuthentication.signInWithGoogle();
       const credential = GoogleAuthProvider.credential(result.credential?.idToken);
       const authResult = await signInWithCredential(auth, credential);
       return await processAuthResult(authResult.user);
    } else {
       // For web, use popup which is generally safer for partitioned storage unless forced to redirect
       const isIOSMobileWeb = !Capacitor.isNativePlatform() && /iPad|iPhone|iPod/.test(navigator.userAgent);
       
       if (isIOSMobileWeb) {
         await signInWithRedirect(auth, googleProvider);
         return null;
       } else {
         const result = await signInWithPopup(auth, googleProvider);
         return await processAuthResult(result.user);
       }
    }
  } catch (error: any) {
    console.error("Firebase Auth Error", error);
    toast.error(error.message || "Failed to log in");
    throw error;
  }
}

export async function handleRedirectLogin() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return await processAuthResult(result.user);
    }
    return null;
  } catch (error: any) {
    console.error("Firebase Auth Redirect Error", error);
    toast.error(error.message || "Failed to complete login");
    return null;
  }
}

async function processAuthResult(user: any) {
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
}

export async function logoutUser() {
  await signOut(auth);
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return await processAuthResult(result.user);
  } catch (error: any) {
    console.error("Firebase Email Auth Error", error);
    toast.error(error.message || "Failed to log in");
    throw error;
  }
}

export async function signupWithEmail(email: string, pass: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return await processAuthResult(result.user);
  } catch (error: any) {
    console.error("Firebase Email Auth Error", error);
    toast.error(error.message || "Failed to sign up");
    throw error;
  }
}
