import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAt_glvat6aPw_Hxdu1wPvKTwwzSeWkGR8",
  authDomain: "exa-inc.firebaseapp.com",
  databaseURL: "https://exa-inc.firebaseio.com",
  projectId: "exa-inc",
  storageBucket: "exa-inc.firebasestorage.app",
  messagingSenderId: "94918537306",
  appId: "1:94918537306:web:821991be2555d34a166863",
  measurementId: "G-339R6HGQWE"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ── Auth helpers ────────────────────────────────────────────

export function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logOut() {
  return signOut(auth);
}

const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}
