import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { toast } from 'sonner';

export const app = initializeApp(firebaseConfig);
// @ts-ignore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // Required ID
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
    if (user.email === 'nayismit3140@gmail.com' || user.email === 'smitlearnsfigma@gmail.com') {
      roleId = 'role-admin';
    }

    if (!userSnap.exists()) {
      // Create new user defaulted to Employee
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || 'Unknown Operator',
        email: user.email || '',
        roleId: roleId
      });
    } else {
      // If user exists and is the admin email, ensure they have the admin role
      if (userSnap.data().roleId !== roleId && (user.email === 'nayismit3140@gmail.com' || user.email === 'smitlearnsfigma@gmail.com')) {
         await setDoc(userRef, { ...userSnap.data(), roleId: roleId });
      }
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
