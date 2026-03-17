import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6cMCmvMeJiA-Agr29gaTHzcUvyoEiQEc",
  authDomain: "sncu-monitor.firebaseapp.com",
  projectId: "sncu-monitor",
  storageBucket: "sncu-monitor.firebasestorage.app",
  messagingSenderId: "555422484416",
  appId: "1:555422484416:web:92d735c51ec6ada435ea25"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };