
export interface User {
  uid: string;
  email: string;
  name: string;
  avatar: string;
  role: 'student' | 'admin' | 'delegate';
  pin: string;
  aiMemory?: string; // Profil cognitif et historique d'apprentissage généré par l'IA
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isAi: boolean;
  status?: 'sending' | 'sent';
}

export interface Resource {
  id: string;
  title: string;
  category: 'cours' | 'td' | 'examen' | 'autre';
  type: string;
  size: string;
  date: number;
  author: string;
  url: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: number;
  tag: 'Urgent' | 'Info' | 'Examen';
  imageUrl?: string; // Image générée par IA
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  questions?: any; // Fallback pour structure potentiellement différente
}

export interface MemoryPair {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
}

export interface Delegate {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Fortune {
  chengyu: string;
  pinyin: string;
  translation: string;
  advice: string;
  luckyColor: string;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  CHAT = 'chat',
  FILES = 'files',
  QUIZ = 'quiz',
  PROFILE = 'profile',
  ABOUT = 'about'
}
