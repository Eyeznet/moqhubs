// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCKReyxyULhHYFlayzedLwCdyLhrp8wxRQ",
  authDomain: "moqhubs.firebaseapp.com",
  projectId: "moqhubs",
  storageBucket: "moqhubs.firebasestorage.app",
  messagingSenderId: "161346931712",
  appId: "1:161346931712:web:c41b32fd8d4d77e36edce5",
  measurementId: "G-RZF9WD276P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Make sure these are exported!
export { db, auth };