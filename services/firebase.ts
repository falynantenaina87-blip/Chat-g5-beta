
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Configuration Firebase G5 L1.
 * Nous utilisons l'API_KEY injectée par l'environnement.
 */
const firebaseConfig = {
  apiKey: process.env.API_KEY, 
  authDomain: "g5-l1-portail.firebaseapp.com",
  projectId: "g5-l1-portail",
  storageBucket: "g5-l1-portail.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialisation directe (sans if) pour signaler immédiatement toute erreur de config
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

console.info("✅ Firebase connecté au Cloud G5.");
