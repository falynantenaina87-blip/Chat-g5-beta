
import { Message, Resource, NewsItem } from '../types';

const STORAGE_KEYS = {
  NEWS: 'g5_news_v1',
  RESOURCES: 'g5_resources_v1',
  MESSAGES: 'g5_messages_v1',
};

const INITIAL_NEWS: NewsItem[] = [
  { id: '1', title: 'Examen de Caractères', content: 'Prévu pour lundi prochain à 14h en Amphi B. Révisez les radicaux de l\'eau et du feu.', date: Date.now(), tag: 'Examen' },
  { id: '2', title: 'Nouveau cours HSK 1', content: 'Le PDF du chapitre 4 est disponible dans le FileManager. Pensez à l\'imprimer pour le TD.', date: Date.now() - 3600000, tag: 'Info' },
];

const INITIAL_RESOURCES: Resource[] = [
  { id: 'r1', title: 'Grammaire Chinoise L1', category: 'cours', type: 'PDF', size: '2.4 MB', date: Date.now() - 172800000, author: 'Prof. Wei', url: '#' },
  { id: 'r2', title: 'Audio HSK 1 - Chapitre 3', category: 'td', type: 'MP3', size: '15.1 MB', date: Date.now() - 86400000, author: 'Délégué G5', url: '#' },
];

const getStored = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : initial;
};

const setStored = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockDb = {
  getNews: () => getStored<NewsItem[]>(STORAGE_KEYS.NEWS, INITIAL_NEWS),
  saveNews: (news: NewsItem[]) => setStored(STORAGE_KEYS.NEWS, news),
  
  getResources: () => getStored<Resource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES),
  saveResources: (resources: Resource[]) => setStored(STORAGE_KEYS.RESOURCES, resources),
  
  getMessages: () => getStored<Message[]>(STORAGE_KEYS.MESSAGES, []),
  saveMessages: (messages: Message[]) => setStored(STORAGE_KEYS.MESSAGES, messages),

  getDelegates: () => [
    { name: 'Sophie L.', role: 'Déléguée titulaire', avatar: '👩‍🎓' },
    { name: 'Marc D.', role: 'Délégué suppléant', avatar: '👨‍🎓' }
  ],

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('g5_session_v1');
  }
};
