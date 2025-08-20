import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBKY6zmuE3FUTRZZ56AKq6C3AG074oA4uM",
  authDomain: "elysian-e6763.firebaseapp.com",
  projectId: "elysian-e6763",
  storageBucket: "elysian-e6763.firebasestorage.app",
  messagingSenderId: "505256628087",
  appId: "1:505256628087:web:e66b2ac8b3d6ffed125b72",
  measurementId: "G-GWS8J98JZV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;