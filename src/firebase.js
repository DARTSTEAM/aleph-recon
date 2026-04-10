import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHBf6z6TRhBpqPm2to073VtiHJ7ZyXGv4",
  authDomain: "hike-agentic-playground.firebaseapp.com",
  projectId: "hike-agentic-playground",
  storageBucket: "hike-agentic-playground.firebasestorage.app",
  messagingSenderId: "966549276703",
  appId: "1:966549276703:web:d2dc8113a69d14dc62ed2a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
