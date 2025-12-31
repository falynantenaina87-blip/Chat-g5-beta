
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Files, 
  User as UserIcon, 
  Send, 
  Download, 
  LogOut,
  Wifi,
  Loader2,
  RefreshCw,
  Sparkles,
  Bot,
  BrainCircuit,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AppTab, User, Message, NewsItem, Resource, QuizQuestion, Fortune } from './types';
import { dbService } from './services/db';
import { geminiService } from './services/geminiService';

// --- COMPOSANTS AUXILIAIRES ---

const UserAvatar = ({ avatar, size = "md", role = 'student' }: { avatar: string, size?: string, role?: string }) => {
  let border = "from-slate-700 to-slate-800";
  if (role === 'admin') border = "from-amber-400 to-orange-500";
  if (role === 'bot') border = "from-purple-400 to-indigo-500";
  
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : size === 'lg' ? 'w-20 h-20' : 'w-32 h-32';
  const text = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xl' : 'text-4xl';

  return (
    <div className={`rounded-full p-[2px] bg-gradient-to-br ${border} shadow-lg shrink-0`}>
        <div className={`rounded-full flex items-center justify-center overflow-hidden bg-slate-900 ${dim} ${text}`}>
        {avatar.startsWith("http") || avatar.startsWith("data:") ? <img src={avatar} className="w-full h-full object-cover" /> : <span>{avatar}</span>}
        </div>
    </div>
  );
};

const DashboardView = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  useEffect(() => dbService.subscribeToNews(setNews), []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Actualités Groupe 5</h3>
        <RefreshCw size={12} className="text-slate-600 animate-spin" />
      </div>
      {news.length === 0 ? (
        <div className="glass p-10 rounded-[2rem] text-center text-slate-500 text-sm italic border-white/5">En attente d'infos...</div>
      ) : (
        news.map(item => (
          <div key={item.id} className="glass p-6 rounded-[2.5rem] border-white/5">
            <span className="text-[9px] font-bold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full mb-3 inline-block uppercase">{item.tag}</span>
            <h4 className="font-bold text-white text-lg mb-2">{item.title}</h4>
            <p className="text-sm text-slate-400 leading-relaxed">{item.content}</p>
          </div>
        ))
      )}
    </div>
  );
};

const ChatView = ({ user }: { user: User }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => dbService.subscribeToMessages(setMessages), []);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, isTyping]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const txt = input.trim();
    setInput("");

    await dbService.addMessage({
      senderId: user.uid, senderName: user.name, senderAvatar: user.avatar,
      text: txt, isAi: false
    });

    if (txt.toLowerCase().includes('bot') || txt.includes('?')) {
      setIsTyping(true);
      let full = "";
      const stream = geminiService.streamChatResponse(txt, messages, user.aiMemory, user.name);
      for await (const chunk of stream) { full += chunk; }
      await dbService.addMessage({
        senderId: 'ai', senderName: 'Lǎoshī Bot', senderAvatar: '🤖',
        text: full, isAi: true
      });
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-210px)]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex gap-3 ${m.senderId === user.uid ? 'flex-row-reverse' : ''} animate-fade-in`}>
             <UserAvatar avatar={m.senderAvatar} size="sm" role={m.isAi ? 'bot' : 'student'} />
             <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.senderId === user.uid ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-white/5 text-slate-200'}`}>
                {m.senderId !== user.uid && <p className="text-[9px] font-bold text-cyan-400 mb-1 uppercase">{m.senderName}</p>}
                <ReactMarkdown className="prose prose-invert max-w-none text-sm leading-relaxed">{m.text}</ReactMarkdown>
             </div>
          </div>
        ))}
        {isTyping && <div className="flex gap-3 animate-pulse"><UserAvatar avatar="🤖" size="sm" role="bot" /><div className="bg-slate-900 p-4 rounded-2xl"><Loader2 className="animate-spin text-blue-400" size={14} /></div></div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSend} className="mt-4 relative">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Question au groupe ou au Bot..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:ring-1 focus:ring-blue-500" />
        <button type="submit" className="absolute right-3 top-3 p-2 bg-blue-600 rounded-xl text-white shadow-lg"><Send size={18} /></button>
      </form>
    </div>
  );
};

const FilesView = () => {
  const [res, setRes] = useState<Resource[]>([]);
  useEffect(() => dbService.subscribeToResources(setRes), []);
  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 px-2">Ressources Partagées</h3>
      {res.map(f => (
        <div key={f.id} className="glass p-5 rounded-2xl flex items-center justify-between border-white/5">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-[10px] font-black text-amber-500 border border-amber-500/20">{f.type}</div>
             <div><h4 className="text-sm font-bold text-white">{f.title}</h4><p className="text-[10px] text-slate-500 mt-1">{f.author} • {f.size}</p></div>
          </div>
          <a href={f.url} download className="p-2 text-slate-500 hover:text-white"><Download size={20} /></a>
        </div>
      ))}
    </div>
  );
};

const QuizView = () => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const startQuiz = async () => {
    setLoading(true);
    setQuestions([]);
    setScore(0);
    setCurrentIndex(0);
    setShowResult(false);
    setSelected(null);
    const qs = await geminiService.generateQuiz();
    setQuestions(qs);
    setLoading(false);
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === questions[currentIndex].correctAnswer) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      // End
      alert(`Quiz terminé ! Score : ${score}/${questions.length}`);
      setQuestions([]);
    }
  };

  if (loading) return <div className="flex flex-col items-center justify-center h-64"><Loader2 className="animate-spin text-purple-400 mb-4" size={40} /><p className="text-slate-400 text-sm animate-pulse">L'IA prépare le quiz...</p></div>;

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
        <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 text-purple-400"><BrainCircuit size={40} /></div>
        <h2 className="text-2xl font-bold text-white mb-2">Entraînement IA</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-xs">Générez un quiz unique basé sur le programme HSK1 pour tester vos connaissances.</p>
        <button onClick={startQuiz} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-purple-900/30 transition-all flex items-center gap-2"><Sparkles size={18} /> Générer un Quiz</button>
      </div>
    );
  }

  const q = questions[currentIndex];
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500 px-2">
        <span>Question {currentIndex + 1}/{questions.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="glass p-6 rounded-[2rem] border-white/5">
        <h3 className="text-xl font-bold text-white mb-6 leading-relaxed">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all ${
                selected === null 
                  ? 'bg-slate-900/50 hover:bg-slate-800 text-slate-200' 
                  : idx === q.correctAnswer 
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                    : idx === selected 
                      ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                      : 'bg-slate-900/30 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {selected !== null && idx === q.correctAnswer && <CheckCircle size={16} />}
                {selected === idx && idx !== q.correctAnswer && <XCircle size={16} />}
              </div>
            </button>
          ))}
        </div>
        {showResult && (
          <div className="mt-6 pt-6 border-t border-white/5 animate-fade-in">
            <p className="text-sm text-slate-300 mb-4 bg-slate-900/50 p-4 rounded-xl">{q.explanation}</p>
            <button onClick={nextQuestion} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl">Suivant</button>
          </div>
        )}
      </div>
    </div>
  );
};

const AboutView = () => {
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [loading, setLoading] = useState(false);

  const getFortune = async () => {
    setLoading(true);
    const f = await geminiService.generateFortune();
    setFortune(f);
    setLoading(false);
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="glass p-8 rounded-[2.5rem] text-center border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none"></div>
        <h2 className="text-2xl font-black text-white mb-2">Chengyu du Jour</h2>
        <p className="text-slate-400 text-xs mb-6">Sagesse chinoise propulsée par IA</p>
        
        {!fortune && !loading && (
          <button onClick={getFortune} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all">
            🥠 Ouvrir un biscuit
          </button>
        )}
        
        {loading && <Loader2 className="animate-spin mx-auto text-amber-500" size={32} />}

        {fortune && (
          <div className="animate-fade-in space-y-4">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 my-4">{fortune.chengyu}</div>
            <div className="text-sm font-mono text-slate-500 mb-2">{fortune.pinyin}</div>
            <p className="text-lg text-white font-medium italic">"{fortune.translation}"</p>
            <div className="bg-slate-900/50 p-4 rounded-xl mt-4 text-sm text-slate-300">
              <span className="text-amber-500 font-bold block mb-1 uppercase text-[10px] tracking-widest">Conseil</span>
              {fortune.advice}
            </div>
            <button onClick={getFortune} className="text-xs text-slate-500 mt-4 hover:text-white flex items-center justify-center gap-1 mx-auto"><RefreshCw size={10} /> Nouveau tirage</button>
          </div>
        )}
      </div>
      
      <div className="p-4 text-center">
        <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-4">À propos du G5</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          Application communautaire créée pour les étudiants de Licence 1 Chinois.
          Hébergée sur le Cloud. v2.0.1
        </p>
      </div>
    </div>
  );
}

const ProfileView = ({ user }: { user: User }) => (
  <div className="space-y-10 py-10 text-center animate-fade-in">
    <UserAvatar avatar={user.avatar} size="xl" role={user.role} />
    <div>
      <h2 className="text-3xl font-black text-white">{user.name}</h2>
      <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mt-3">{user.role}</p>
    </div>
    <div className="px-6">
      <button onClick={() => dbService.fullReset()} className="w-full glass p-5 rounded-[2rem] flex items-center justify-center gap-3 text-red-400 font-bold border-red-500/10 hover:bg-red-500/5 transition-all">
        <LogOut size={20} /> Déconnexion
      </button>
    </div>
  </div>
);

// --- COMPOSANT PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [formData, setFormData] = useState({ pseudo: "", pin: "", code: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('g5_session_v1');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // --- EFFET DE BACKGROUND DYNAMIQUE CORRIGÉ ---
  useEffect(() => {
    // Note: Utilisation de %20 pour les espaces dans l'URL statique
    // Si user connecté : GIF (./giphy.gif)
    // Sinon : JPG (./background%20photo%20g5l1.jpg)
    const bgUrl = user ? '/giphy.gif' : '/background%20photo%20g5l1.jpg';
    
    document.body.style.backgroundImage = `
      linear-gradient(to bottom, rgba(2, 6, 23, 0.7), rgba(2, 6, 23, 0.9)),
      url('${bgUrl}')
    `;
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    if (formData.code !== "G5L1-2025-CHINE-X" && formData.code !== "ADMIN-G5-MASTER") {
      setError("Code d'accès invalide."); setLoading(false); return;
    }
    try {
      const u = await dbService.getOrCreateUser(formData.pseudo, formData.code.includes("ADMIN") ? "admin" : "student", "🐲", formData.pin);
      setUser(u); localStorage.setItem('g5_session_v1', JSON.stringify(u));
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md glass p-10 rounded-[3rem] space-y-8 animate-fade-in border-white/5">
          <div className="text-center"><h1 className="text-4xl font-black text-white tracking-tighter uppercase">G5 L1</h1><p className="text-[10px] font-bold text-cyan-400 mt-2 uppercase">Cloud System</p></div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Pseudo" value={formData.pseudo} onChange={e=>setFormData({...formData, pseudo: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:ring-1 focus:ring-blue-500" required />
            <div className="grid grid-cols-2 gap-4">
              <input type="password" placeholder="PIN" maxLength={4} value={formData.pin} onChange={e=>setFormData({...formData, pin: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-white text-center font-mono" required />
              <input type="password" placeholder="Code" value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 text-white text-center" required />
            </div>
            {error && <p className="text-red-400 text-[10px] text-center font-bold uppercase">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20">{loading ? <Loader2 className="animate-spin mx-auto" /> : "Entrer"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 max-w-2xl mx-auto flex flex-col px-4">
      <header className="sticky top-0 z-40 glass-dark py-4 flex justify-between items-center border-b border-white/5 mt-4 rounded-2xl px-4">
        <div className="flex items-center gap-3">
             <UserAvatar avatar={user.avatar} size="sm" role={user.role} />
             <div><h2 className="text-sm font-bold text-white">{user.name}</h2><p className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 uppercase"><Wifi size={10} /> Sync OK</p></div>
        </div>
        <div className="text-slate-700 font-black text-xl italic tracking-tighter">G5</div>
      </header>

      <main className="flex-1 mt-6">
        {activeTab === AppTab.DASHBOARD && <DashboardView />}
        {activeTab === AppTab.CHAT && <ChatView user={user} />}
        {activeTab === AppTab.FILES && <FilesView />}
        {activeTab === AppTab.QUIZ && <QuizView />}
        {activeTab === AppTab.ABOUT && <AboutView />}
        {activeTab === AppTab.PROFILE && <ProfileView user={user} />}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="glass-nav px-6 py-3 rounded-full flex items-center gap-4">
          <NavBtn active={activeTab === AppTab.DASHBOARD} icon={<LayoutDashboard size={20} />} onClick={() => setActiveTab(AppTab.DASHBOARD)} color="text-cyan-400" />
          <NavBtn active={activeTab === AppTab.CHAT} icon={<MessageSquare size={20} />} onClick={() => setActiveTab(AppTab.CHAT)} color="text-emerald-400" />
          <NavBtn active={activeTab === AppTab.FILES} icon={<Files size={20} />} onClick={() => setActiveTab(AppTab.FILES)} color="text-amber-400" />
          
          <div className="w-[1px] h-5 bg-white/10 mx-1"></div>
          
          <NavBtn active={activeTab === AppTab.QUIZ} icon={<BrainCircuit size={20} />} onClick={() => setActiveTab(AppTab.QUIZ)} color="text-purple-400" />
          <NavBtn active={activeTab === AppTab.ABOUT} icon={<Info size={20} />} onClick={() => setActiveTab(AppTab.ABOUT)} color="text-indigo-400" />
          <NavBtn active={activeTab === AppTab.PROFILE} icon={<UserIcon size={20} />} onClick={() => setActiveTab(AppTab.PROFILE)} color="text-pink-400" />
        </div>
      </nav>
    </div>
  );
}

const NavBtn = ({ active, icon, onClick, color }: any) => (
  <button onClick={onClick} className={`transition-all p-2 rounded-xl ${active ? `${color} bg-white/5 scale-110` : 'text-slate-500 hover:text-slate-300'}`}>{icon}</button>
);
