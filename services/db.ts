
import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  Timestamp,
  limit
} from "firebase/firestore";
import { Message, NewsItem, Resource, User } from "../types";

const mapDoc = (d: any) => {
  const data = d.data();
  return {
    ...data,
    id: d.id,
    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : Date.now()
  };
};

export const dbService = {
  // Authentification Cloud
  getOrCreateUser: async (pseudo: string, role: string, avatar: string, pin: string): Promise<User> => {
    const userId = pseudo.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const userRef = doc(db, "users", userId);
    
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const existing = userSnap.data() as User;
      if (existing.pin !== pin) throw new Error("Code PIN incorrect.");
      return { ...existing, uid: userId };
    } else {
      const newUser: any = { 
        uid: userId, name: pseudo.trim(), avatar, role, pin, aiMemory: "" 
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
  },

  // Abonnements Temps Réel (Mode Push)
  subscribeToMessages: (cb: (msgs: Message[]) => void) => {
    // Vérification de sécurité pour éviter d'écouter une collection vide si la config est cassée
    if (!db) return () => {};

    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"), limit(50));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map(mapDoc) as Message[]);
    }, (error) => {
      console.error("❌ Erreur de lecture (subscribeToMessages) :", error);
    });
  },

  subscribeToNews: (cb: (news: NewsItem[]) => void) => {
    const q = query(collection(db, "news"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem))));
  },

  subscribeToResources: (cb: (res: Resource[]) => void) => {
    const q = query(collection(db, "resources"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource))));
  },

  // Envoi Cloud avec Diagnostic
  addMessage: async (msg: any) => {
    try {
      console.log("📤 Envoi message vers Firestore...", msg);
      await addDoc(collection(db, "messages"), { ...msg, timestamp: serverTimestamp() });
      console.log("✅ Message enregistré avec succès.");
    } catch (error: any) {
      console.error("🔥 ÉCHEC ÉCRITURE FIREBASE :", error);
      if (error.code === 'permission-denied') {
        console.error("👉 Vérifiez vos règles de sécurité Firestore (Rules).");
      } else if (error.code === 'not-found') {
        console.error("👉 Le projet Firestore semble ne pas exister ou l'URL est mauvaise.");
      }
      throw error; // Renvoie l'erreur à l'UI pour affichage
    }
  },

  fullReset: () => {
    localStorage.removeItem('g5_session_v1');
    window.location.reload();
  }
};
