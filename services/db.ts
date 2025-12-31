
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
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"), limit(50));
    return onSnapshot(q, (snap) => cb(snap.docs.map(mapDoc) as Message[]));
  },

  subscribeToNews: (cb: (news: NewsItem[]) => void) => {
    const q = query(collection(db, "news"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem))));
  },

  subscribeToResources: (cb: (res: Resource[]) => void) => {
    const q = query(collection(db, "resources"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource))));
  },

  // Envoi Cloud
  addMessage: async (msg: any) => {
    await addDoc(collection(db, "messages"), { ...msg, timestamp: serverTimestamp() });
  },

  fullReset: () => {
    localStorage.removeItem('g5_session_v1');
    window.location.reload();
  }
};
