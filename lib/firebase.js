import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBudKKrK-DWUe3yHNWip4wBNXIjuFwlDcU",
  authDomain: "tblinc820auth.firebaseapp.com",
  projectId: "tblinc820auth",
  storageBucket: "tblinc820auth.firebasestorage.app",
  messagingSenderId: "926149243243",
  appId: "1:926149243243:web:3f38f36c160854e9969c2e",
  measurementId: "G-WKL3TE6JTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
};
