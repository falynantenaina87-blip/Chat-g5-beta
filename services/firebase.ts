
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Helper pour lire les variables d'environnement (Compatible Vite & Standard)
const getEnv = (key: string) => {
  try {
    // @ts-ignore - Support Vite
    if (import.meta && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[`VITE_${key}`] || import.meta.env[key];
      if (val) return val;
    }
  } catch (e) {}
  
  try {
    // Support Node/Webpack
    if (typeof process !== 'undefined' && process.env) {
      return process.env[`VITE_${key}`] || process.env[key];
    }
  } catch (e) {}

  return undefined;
};

// --- CONFIGURATION ---
const apiKey = getEnv('FIREBASE_API_KEY') || getEnv('API_KEY');
const projectId = getEnv('FIREBASE_PROJECT_ID') || "g5l1-beta";

if (!apiKey) {
  console.error("❌ ERREUR CRITIQUE : API Key manquante. Vérifiez que 'VITE_FIREBASE_API_KEY' est définie sur Vercel.");
} else {
  console.log(`✅ Config Firebase chargée pour le projet : ${projectId} (Mode Vite détecté)`);
}

const firebaseConfig = {
  apiKey: apiKey, 
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || `${projectId}.appspot.com`,
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || "123456789",
  appId: getEnv('FIREBASE_APP_ID') || "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
