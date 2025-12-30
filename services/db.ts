import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  Timestamp,
  getDocs,
  limit,
  setDoc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { Message, NewsItem, Resource, Delegate, User } from "../types";

// --- HELPERS LOCAL STORAGE (FALLBACK ISOLÉ) ---
const STORAGE_KEYS = {
  NEWS: 'g5_news_v1',
  RESOURCES: 'g5_resources_v1',
  MESSAGES_PUBLIC: 'g5_messages_public_v1',
  MESSAGES_PRIVATE: 'g5_messages_private_v1',
  DELEGATES: 'g5_delegates_v1',
  SCHEDULE: 'g5_schedule_v1',
  USERS: 'g5_users_directory_v1' // Nouveau pour simuler l'unicité en local
};

const INITIAL_NEWS: NewsItem[] = [];
const INITIAL_RESOURCES: Resource[] = [
  { id: 'r1', title: 'Grammaire Chinoise L1', category: 'cours', type: 'PDF', size: '2.4 MB', date: Date.now() - 172800000, author: 'Prof. Wei', url: '#' },
];
const INITIAL_DELEGATES: Delegate[] = [
  { id: 'd1', name: 'Sophie L.', role: 'Déléguée', avatar: '👩‍🎓' },
  { id: 'd2', name: 'Marc D.', role: 'Suppléant', avatar: '👨‍🎓' }
];

// Récupère une clé spécifique à l'utilisateur si uid est fourni
const getStorageKey = (baseKey: string, uid?: string) => {
  return uid ? `${baseKey}_${uid}` : baseKey;
};

const getLocal = <T>(key: string, initial: T, uid?: string): T => {
  const finalKey = getStorageKey(key, uid);
  const stored = localStorage.getItem(finalKey);
  return stored ? JSON.parse(stored) : initial;
};

const setLocal = <T>(key: string, data: T, uid?: string) => {
  const finalKey = getStorageKey(key, uid);
  localStorage.setItem(finalKey, JSON.stringify(data));
};

// --- SERVICE UNIFIÉ ---

export const dbService = {
  // --- GESTION UTILISATEURS (AUTH) ---
  getOrCreateUser: async (pseudo: string, role: 'student' | 'admin', avatar: string, pin: string): Promise<User> => {
    // ID technique basé sur le pseudo pour garantir l'unicité (ex: "thomas_g")
    const userId = pseudo.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    
    if (db) {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const existingUser = userSnap.data() as User;
        
        // VÉRIFICATION DU PIN
        if (existingUser.pin && existingUser.pin !== pin) {
          throw new Error("Code PIN incorrect pour ce pseudo.");
        }

        // Mise à jour du rôle si l'utilisateur se connecte avec le code Admin
        if (existingUser.role !== 'admin' && role === 'admin') {
           await updateDoc(userRef, { role: 'admin', avatar: avatar });
           return { ...existingUser, role: 'admin', avatar: avatar };
        }
        return existingUser;
      } else {
        // Création nouvel utilisateur
        const newUser: User = {
          uid: userId,
          name: pseudo.trim(),
          email: `${userId}@student.g5`,
          avatar: role === 'admin' ? "🛡️" : avatar,
          role: role,
          pin: pin // Enregistrement du PIN
        };
        await setDoc(userRef, newUser);
        return newUser;
      }
    } else {
      // Fallback LocalStorage
      const usersMap = getLocal<Record<string, User>>(STORAGE_KEYS.USERS, {});
      
      if (usersMap[userId]) {
        const existingUser = usersMap[userId];
        
        // VÉRIFICATION DU PIN LOCAL
        if (existingUser.pin && existingUser.pin !== pin) {
          throw new Error("Code PIN incorrect pour ce pseudo.");
        }

        if (existingUser.role !== 'admin' && role === 'admin') {
          existingUser.role = 'admin';
          existingUser.avatar = avatar;
          usersMap[userId] = existingUser;
          setLocal(STORAGE_KEYS.USERS, usersMap);
        }
        return existingUser;
      } else {
        const newUser: User = {
          uid: userId,
          name: pseudo.trim(),
          email: `${userId}@student.g5`,
          avatar: role === 'admin' ? "🛡️" : avatar,
          role: role,
          pin: pin
        };
        usersMap[userId] = newUser;
        setLocal(STORAGE_KEYS.USERS, usersMap);
        return newUser;
      }
    }
  },

  getAllUsers: async (): Promise<User[]> => {
    if (db) {
      const q = query(collection(db, "users"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as User);
    } else {
      const usersMap = getLocal<Record<string, User>>(STORAGE_KEYS.USERS, {});
      return Object.values(usersMap).sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  // --- MESSAGERIE PUBLIQUE (GROUPE) ---
  subscribeToPublicMessages: (callback: (msgs: Message[]) => void) => {
    if (db) {
      const q = query(collection(db, "messages"), orderBy("timestamp", "asc"), limit(100));
      return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        callback(msgs);
      }, (error) => console.error("Firestore Public Chat Error:", error));
    } else {
      const msgs = getLocal<Message[]>(STORAGE_KEYS.MESSAGES_PUBLIC, []);
      callback(msgs);
      return () => {};
    }
  },

  addPublicMessage: async (msg: Omit<Message, 'id'>) => {
    if (db) {
      await addDoc(collection(db, "messages"), msg);
    } else {
      const msgs = getLocal<Message[]>(STORAGE_KEYS.MESSAGES_PUBLIC, []);
      const newMsg = { ...msg, id: crypto.randomUUID() };
      setLocal(STORAGE_KEYS.MESSAGES_PUBLIC, [...msgs, newMsg]);
      window.dispatchEvent(new Event('local-storage-update-public'));
    }
  },

  // --- MESSAGERIE PRIVÉE (TUTEUR IA) ---
  subscribeToPrivateMessages: (userId: string, callback: (msgs: Message[]) => void) => {
    if (db) {
      const q = query(collection(db, `users/${userId}/private_chat`), orderBy("timestamp", "asc"));
      return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        callback(msgs);
      }, (error) => console.error("Firestore Private Chat Error:", error));
    } else {
      const msgs = getLocal<Message[]>(STORAGE_KEYS.MESSAGES_PRIVATE, [], userId);
      callback(msgs);
      return () => {};
    }
  },

  addPrivateMessage: async (userId: string, msg: Omit<Message, 'id'>) => {
    if (db) {
      await addDoc(collection(db, `users/${userId}/private_chat`), msg);
    } else {
      const msgs = getLocal<Message[]>(STORAGE_KEYS.MESSAGES_PRIVATE, [], userId);
      const newMsg = { ...msg, id: crypto.randomUUID() };
      setLocal(STORAGE_KEYS.MESSAGES_PRIVATE, [...msgs, newMsg], userId);
      window.dispatchEvent(new CustomEvent('local-storage-update-private', { detail: { userId } }));
    }
  },

  clearPrivateMessages: async (userId: string) => {
    if (db) {
      const q = query(collection(db, `users/${userId}/private_chat`));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } else {
      setLocal(STORAGE_KEYS.MESSAGES_PRIVATE, [], userId);
      window.dispatchEvent(new CustomEvent('local-storage-update-private', { detail: { userId } }));
    }
  },

  deletePublicMessage: async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, "messages", id));
    } else {
      const msgs = getLocal<Message[]>(STORAGE_KEYS.MESSAGES_PUBLIC, []);
      setLocal(STORAGE_KEYS.MESSAGES_PUBLIC, msgs.filter(m => m.id !== id));
      window.dispatchEvent(new Event('local-storage-update-public'));
    }
  },
  
  clearPublicMessages: async () => {
    if (db) {
       const q = query(collection(db, "messages"));
       const snapshot = await getDocs(q);
       snapshot.forEach(d => deleteDoc(d.ref));
    } else {
      setLocal(STORAGE_KEYS.MESSAGES_PUBLIC, []);
      window.dispatchEvent(new Event('local-storage-update-public'));
    }
  },

  // --- ACTUALITÉS (GLOBAL) ---
  subscribeToNews: (callback: (news: NewsItem[]) => void) => {
    if (db) {
      const q = query(collection(db, "news"), orderBy("date", "desc"));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
        callback(items);
      });
    } else {
      callback(getLocal<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS));
      return () => {};
    }
  },

  addNews: async (item: Omit<NewsItem, 'id'>) => {
    if (db) {
      await addDoc(collection(db, "news"), item);
    } else {
      const items = getLocal<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS);
      const newItem = { ...item, id: crypto.randomUUID() };
      setLocal(STORAGE_KEYS.NEWS, [newItem, ...items]);
    }
  },

  deleteNews: async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, "news", id));
    } else {
      const items = getLocal<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS);
      setLocal(STORAGE_KEYS.NEWS, items.filter(i => i.id !== id));
    }
  },

  // --- RESSOURCES (GLOBAL) ---
  subscribeToResources: (callback: (resources: Resource[]) => void) => {
    if (db) {
      const q = query(collection(db, "resources"), orderBy("date", "desc"));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        callback(items);
      });
    } else {
      callback(getLocal<Resource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES));
      return () => {};
    }
  },
  
  addResource: async (item: Omit<Resource, 'id'>) => {
     if (db) {
        await addDoc(collection(db, "resources"), item);
     } else {
        const items = getLocal<Resource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
        const newItem = { ...item, id: crypto.randomUUID() };
        setLocal(STORAGE_KEYS.RESOURCES, [newItem, ...items]);
        window.dispatchEvent(new Event('local-storage-update-resources'));
     }
  },

  deleteResource: async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, "resources", id));
    } else {
      const items = getLocal<Resource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
      setLocal(STORAGE_KEYS.RESOURCES, items.filter(r => r.id !== id));
      window.dispatchEvent(new Event('local-storage-update-resources'));
    }
  },

  // --- DÉLÉGUÉS ---
  subscribeToDelegates: (callback: (delegates: Delegate[]) => void) => {
    if (db) {
      const q = query(collection(db, "delegates"));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delegate));
        callback(items);
      });
    } else {
      callback(getLocal<Delegate[]>(STORAGE_KEYS.DELEGATES, INITIAL_DELEGATES));
      return () => {};
    }
  },

  addDelegate: async (delegate: Omit<Delegate, 'id'>) => {
    if (db) {
      await addDoc(collection(db, "delegates"), delegate);
    } else {
      const items = getLocal<Delegate[]>(STORAGE_KEYS.DELEGATES, INITIAL_DELEGATES);
      const newItem = { ...delegate, id: crypto.randomUUID() };
      setLocal(STORAGE_KEYS.DELEGATES, [...items, newItem]);
    }
  },

  deleteDelegate: async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, "delegates", id));
    } else {
      const items = getLocal<Delegate[]>(STORAGE_KEYS.DELEGATES, INITIAL_DELEGATES);
      setLocal(STORAGE_KEYS.DELEGATES, items.filter(d => d.id !== id));
    }
  },

  // --- EMPLOI DU TEMPS (SETTINGS) ---
  getScheduleImage: async (): Promise<string | null> => {
     if (db) {
       try {
         const d = await getDoc(doc(db, "settings", "schedule"));
         if (d.exists()) return d.data().imageUrl;
       } catch (e) { return null; }
       return null;
     } else {
       return localStorage.getItem(STORAGE_KEYS.SCHEDULE);
     }
  },

  saveScheduleImage: async (imageUrl: string) => {
    if (db) {
      await setDoc(doc(db, "settings", "schedule"), { imageUrl });
    } else {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, imageUrl);
    }
  },

  // --- GLOBAL ---
  isFirebaseActive: () => !!db,
  
  fullReset: async (userId?: string) => {
    localStorage.clear();
    if (db && userId) {
       console.log("Reset Firebase: Suppression chat privé.");
       const q = query(collection(db, `users/${userId}/private_chat`));
       const snapshot = await getDocs(q);
       snapshot.forEach(d => deleteDoc(d.ref));
    }
  }
};