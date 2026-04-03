import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhIvS4sHJfuAJ94R1MuwZIpfR0pa31ytM",
  authDomain: "hike-fafo.firebaseapp.com",
  projectId: "hike-fafo",
  storageBucket: "hike-fafo.firebasestorage.app",
  messagingSenderId: "429710757030",
  appId: "1:429710757030:web:5d693e17de82023dbc3867"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
