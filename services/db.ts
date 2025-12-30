
import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  getDocs,
  limit,
  setDoc,
  getDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { Message, NewsItem, Resource, Delegate, User } from "../types";

// --- GESTIONNAIRE D'ÉTAT LOCAL (CACHE MÉMOIRE) ---
// Remplace les événements window/localStorage pour une réactivité instantanée
class LocalStore {
  private subscribers: Record<string, Function[]> = {};
  private data: Record<string, any> = {};

  constructor() {
    // Chargement initial depuis le localStorage pour la persistance
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      const raw = localStorage.getItem('g5_local_db_v2');
      if (raw) this.data = JSON.parse(raw);
    } catch (e) {
      this.data = {};
    }
  }

  private saveToDisk() {
    try {
      localStorage.setItem('g5_local_db_v2', JSON.stringify(this.data));
    } catch (e) {
      console.error("Save error", e);
    }
  }

  // Souscription aux changements (Observer Pattern)
  subscribe(key: string, callback: Function) {
    if (!this.subscribers[key]) this.subscribers[key] = [];
    this.subscribers[key].push(callback);
    // Appel immédiat avec les données actuelles
    callback(this.get(key));
    return () => {
      this.subscribers[key] = this.subscribers[key].filter(cb => cb !== callback);
    };
  }

  get(key: string, defaultVal: any = []) {
    return this.data[key] || defaultVal;
  }

  set(key: string, value: any) {
    this.data[key] = value;
    this.saveToDisk();
    this.notify(key);
  }

  update(key: string, updateFn: (current: any) => any) {
    const current = this.get(key);
    const updated = updateFn(current);
    this.set(key, updated);
  }

  private notify(key: string) {
    if (this.subscribers[key]) {
      const val = this.get(key);
      this.subscribers[key].forEach(cb => cb(val));
    }
  }

  clear() {
    this.data = {};
    this.saveToDisk();
    Object.keys(this.subscribers).forEach(key => this.notify(key));
  }
}

const localStore = new LocalStore();

// Générateur d'ID simple et robuste
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const dbService = {
  // --- GESTION UTILISATEURS (AUTH) ---
  getOrCreateUser: async (pseudo: string, role: 'student' | 'admin', avatar: string, pin: string): Promise<User> => {
    const userId = pseudo.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    
    // Mode Firebase
    if (db) {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const existingUser = userSnap.data() as User;
        if (existingUser.pin && existingUser.pin !== pin) throw new Error("Code PIN incorrect.");
        
        // Vérification promotion Admin
        if (existingUser.role !== 'admin' && role === 'admin') {
           const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
           const adminSnap = await getDocs(adminQuery);
           if (adminSnap.size >= 3) throw new Error("Limite d'administrateurs atteinte (Max 3).");

           await updateDoc(userRef, { role: 'admin', avatar: avatar });
           return { ...existingUser, role: 'admin', avatar: avatar };
        }
        return existingUser;
      } else {
        // Vérification nouvel Admin
        if (role === 'admin') {
           const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
           const adminSnap = await getDocs(adminQuery);
           if (adminSnap.size >= 3) throw new Error("Limite d'administrateurs atteinte (Max 3).");
        }

        const newUser: User = { uid: userId, name: pseudo.trim(), email: `${userId}@student.g5`, avatar: role === 'admin' ? "🛡️" : avatar, role: role, pin: pin, aiMemory: "" };
        await setDoc(userRef, newUser);
        return newUser;
      }
    } 
    
    // Mode Local (Utilisation du Store Mémoire)
    const usersMap = localStore.get('users', {});
    const existingUser = usersMap[userId];

    if (existingUser) {
      if (existingUser.pin && existingUser.pin !== pin) throw new Error("Code PIN incorrect.");
      
      if (existingUser.role !== 'admin' && role === 'admin') {
        const adminCount = Object.values(usersMap).filter((u: any) => u.role === 'admin').length;
        if (adminCount >= 3) throw new Error("Limite d'administrateurs atteinte (Max 3).");

        existingUser.role = 'admin'; existingUser.avatar = avatar; 
        usersMap[userId] = existingUser; 
        localStore.set('users', usersMap);
      }
      return existingUser;
    } else {
      if (role === 'admin') {
        const adminCount = Object.values(usersMap).filter((u: any) => u.role === 'admin').length;
        if (adminCount >= 3) throw new Error("Limite d'administrateurs atteinte (Max 3).");
      }

      const newUser: User = { uid: userId, name: pseudo.trim(), email: `${userId}@student.g5`, avatar: role === 'admin' ? "🛡️" : avatar, role: role, pin: pin, aiMemory: "" };
      usersMap[userId] = newUser; 
      localStore.set('users', usersMap);
      return newUser;
    }
  },

  getAllUsers: async (): Promise<User[]> => {
    if (db) {
      const q = query(collection(db, "users"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as User);
    }
    const usersMap = localStore.get('users', {});
    return Object.values(usersMap) as User[];
  },

  updateUserAiMemory: async (userId: string, newMemory: string) => {
    if (db) {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { aiMemory: newMemory });
    } else {
      const usersMap = localStore.get('users', {});
      if (usersMap[userId]) {
        usersMap[userId].aiMemory = newMemory;
        localStore.set('users', usersMap);
      }
    }
  },

  updateUserAvatar: async (userId: string, newAvatar: string) => {
    if (db) {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { avatar: newAvatar });
    } else {
      const usersMap = localStore.get('users', {});
      if (usersMap[userId]) {
        usersMap[userId].avatar = newAvatar;
        localStore.set('users', usersMap);
      }
    }
  },

  // --- MESSAGERIE PUBLIQUE ---
  subscribeToPublicMessages: (callback: (msgs: Message[]) => void) => {
    if (db) {
      const q = query(collection(db, "messages"), orderBy("timestamp", "asc"), limit(100));
      return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))));
    }
    // Souscription instantanée mémoire
    return localStore.subscribe('public_messages', callback);
  },

  addPublicMessage: async (msg: Omit<Message, 'id'>) => {
    if (db) {
      await addDoc(collection(db, "messages"), msg);
    } else {
      const newMsg = { ...msg, id: generateId() };
      localStore.update('public_messages', (msgs: Message[] = []) => [...msgs, newMsg]);
    }
  },

  deletePublicMessage: async (id: string) => {
    if (db) await deleteDoc(doc(db, "messages", id));
    else localStore.update('public_messages', (msgs: Message[] = []) => msgs.filter(m => m.id !== id));
  },
  
  clearPublicMessages: async () => {
    if (db) {
       const q = query(collection(db, "messages"));
       const snapshot = await getDocs(q);
       snapshot.forEach(d => deleteDoc(d.ref));
    } else {
      localStore.set('public_messages', []);
    }
  },

  // --- MESSAGERIE PRIVÉE ---
  subscribeToPrivateMessages: (userId: string, callback: (msgs: Message[]) => void) => {
    if (db) {
      const q = query(collection(db, `users/${userId}/private_chat`), orderBy("timestamp", "asc"));
      return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))));
    }
    return localStore.subscribe(`private_chat_${userId}`, callback);
  },

  addPrivateMessage: async (userId: string, msg: Omit<Message, 'id'>) => {
    if (db) {
      await addDoc(collection(db, `users/${userId}/private_chat`), msg);
    } else {
      const newMsg = { ...msg, id: generateId() };
      localStore.update(`private_chat_${userId}`, (msgs: Message[] = []) => [...msgs, newMsg]);
    }
  },

  clearPrivateMessages: async (userId: string) => {
    if (db) {
      const q = query(collection(db, `users/${userId}/private_chat`));
      const snapshot = await getDocs(q);
      snapshot.forEach(d => deleteDoc(d.ref));
    } else {
      localStore.set(`private_chat_${userId}`, []);
    }
  },

  // --- ACTUALITÉS ---
  subscribeToNews: (callback: (news: NewsItem[]) => void) => {
    if (db) {
      const q = query(collection(db, "news"), orderBy("date", "desc"));
      return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem))));
    }
    return localStore.subscribe('news', callback);
  },

  addNews: async (item: Omit<NewsItem, 'id'>) => {
    if (db) await addDoc(collection(db, "news"), item);
    else localStore.update('news', (items: NewsItem[] = []) => [{...item, id: generateId()}, ...items]);
  },

  deleteNews: async (id: string) => {
    if (db) await deleteDoc(doc(db, "news", id));
    else localStore.update('news', (items: NewsItem[] = []) => items.filter(i => i.id !== id));
  },

  // --- RESSOURCES ---
  subscribeToResources: (callback: (resources: Resource[]) => void) => {
    if (db) {
      const q = query(collection(db, "resources"), orderBy("date", "desc"));
      return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource))));
    }
    // Données initiales si vide
    const initialResources = [
       { id: 'r1', title: 'Grammaire Chinoise L1', category: 'cours', type: 'PDF', size: '2.4 MB', date: Date.now() - 172800000, author: 'Prof. Wei', url: '#' },
    ];
    if (localStore.get('resources').length === 0) localStore.set('resources', initialResources);
    
    return localStore.subscribe('resources', callback);
  },
  
  addResource: async (item: Omit<Resource, 'id'>) => {
     if (db) await addDoc(collection(db, "resources"), item);
     else localStore.update('resources', (items: Resource[] = []) => [{...item, id: generateId()}, ...items]);
  },

  deleteResource: async (id: string) => {
    if (db) await deleteDoc(doc(db, "resources", id));
    else localStore.update('resources', (items: Resource[] = []) => items.filter(r => r.id !== id));
  },

  // --- DÉLÉGUÉS ---
  subscribeToDelegates: (callback: (delegates: Delegate[]) => void) => {
    if (db) {
      const q = query(collection(db, "delegates"));
      return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delegate))));
    }
     const initialDelegates = [
      { id: 'd1', name: 'Sophie L.', role: 'Déléguée', avatar: '👩‍🎓' },
      { id: 'd2', name: 'Marc D.', role: 'Suppléant', avatar: '👨‍🎓' }
    ];
    if (localStore.get('delegates').length === 0) localStore.set('delegates', initialDelegates);
    return localStore.subscribe('delegates', callback);
  },

  addDelegate: async (delegate: Omit<Delegate, 'id'>) => {
    if (db) await addDoc(collection(db, "delegates"), delegate);
    else localStore.update('delegates', (items: Delegate[] = []) => [...items, {...delegate, id: generateId()}]);
  },

  deleteDelegate: async (id: string) => {
    if (db) await deleteDoc(doc(db, "delegates", id));
    else localStore.update('delegates', (items: Delegate[] = []) => items.filter(d => d.id !== id));
  },

  // --- SETTINGS ---
  getScheduleImage: async (): Promise<string | null> => {
     if (db) {
       try { const d = await getDoc(doc(db, "settings", "schedule")); if (d.exists()) return d.data().imageUrl; } catch (e) { return null; }
       return null;
     } 
     return localStore.get('schedule', null);
  },

  saveScheduleImage: async (imageUrl: string) => {
    if (db) await setDoc(doc(db, "settings", "schedule"), { imageUrl });
    else localStore.set('schedule', imageUrl);
  },

  isFirebaseActive: () => !!db,
  
  fullReset: async (userId?: string) => {
    localStore.clear();
    localStorage.clear(); // Nettoyage total
    if (db && userId) {
       const q = query(collection(db, `users/${userId}/private_chat`));
       const snapshot = await getDocs(q);
       snapshot.forEach(d => deleteDoc(d.ref));
    }
  }
};
