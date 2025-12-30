import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase
// NOTE: Ces valeurs doivent être définies dans votre environnement (ex: .env ou Cloudflare Dashboard)
// Si les clés sont manquantes, l'app utilisera automatiquement le mode "Offline/LocalStorage".
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let db = null;
let app = null;

try {
  // On vérifie si la config minimale est présente pour éviter un crash au démarrage
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("[FIREBASE] Initialisé avec succès.");
  } else {
    console.warn("[FIREBASE] Clés API manquantes. Mode hors-ligne (LocalStorage) activé.");
  }
} catch (error) {
  console.error("[FIREBASE] Erreur d'initialisation:", error);
}

export { db };
