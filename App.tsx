
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Files, 
  Gamepad2, 
  User as UserIcon, 
  Send, 
  Download, 
  Bell, 
  BookOpen,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  PlusCircle,
  Wifi,
  WifiOff,
  Users,
  Bot,
  ShieldAlert,
  Edit,
  UserPlus,
  X,
  Sparkles,
  Loader2,
  BrainCircuit,
  Dna,
  Grid3X3,
  ListChecks,
  Timer,
  Menu,
  MoreHorizontal,
  Camera
} from 'lucide-react';
import { AppTab, User, Message, QuizQuestion, NewsItem, Resource, Delegate, Fortune, MemoryPair } from './types';
import { geminiService } from './services/geminiService';
import { dbService } from './services/db';

const INVITATION_CODE = "G5L1-2025-CHINE-X";
const ADMIN_CODE = "ADMIN-G5-MASTER";

// Composant Helper pour afficher l'avatar (Image ou Emoji)
const UserAvatar = ({ avatar, className = "", size = "md" }: { avatar: string, className?: string, size?: "sm" | "md" | "lg" | "xl" }) => {
  const isImage = avatar.startsWith("data:") || avatar.startsWith("http");
  
  return (
    <div className={`rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-white/10 shadow-inner bg-gradient-to-br from-slate-800 to-black ${className}`} 
      style={{
        width: size === 'sm' ? '2rem' : size === 'md' ? '3rem' : size === 'lg' ? '5rem' : '8rem',
        height: size === 'sm' ? '2rem' : size === 'md' ? '3rem' : size === 'lg' ? '5rem' : '8rem',
        fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.5rem' : size === 'lg' ? '2.5rem' : '4rem'
      }}
    >
      {isImage ? (
        <img src={avatar} alt="User" className="w-full h-full object-cover" />
      ) : (
        <span>{avatar}</span>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [invitationCode, setInvitationCode] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('g5_session_v1');
    if (saved) setUser(JSON.parse(saved));
    setIsOnline(dbService.isFirebaseActive());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);

    const code = invitationCode.trim();
    let role: 'student' | 'admin' = 'student';

    if (code === INVITATION_CODE) {
      role = 'student';
    } else if (code === ADMIN_CODE) {
      role = 'admin';
    } else {
      setAuthError("Code d'accès invalide.");
      setIsLoggingIn(false);
      return;
    }

    if (pseudo.trim().length < 2) {
      setAuthError("Le pseudo doit contenir au moins 2 caractères.");
      setIsLoggingIn(false);
      return;
    }

    if (pin.length !== 4 || isNaN(Number(pin))) {
      setAuthError("Le PIN doit comporter 4 chiffres.");
      setIsLoggingIn(false);
      return;
    }

    try {
      // Récupération ou création de l'utilisateur unique basé sur le pseudo ET le PIN
      const userData = await dbService.getOrCreateUser(pseudo, role, "🐲", pin);
      
      setUser(userData);
      localStorage.setItem('g5_session_v1', JSON.stringify(userData));
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Code PIN")) {
        setAuthError("Ce pseudo existe déjà avec un autre code PIN.");
      } else if (err.message.includes("Limite")) {
        setAuthError(err.message);
      } else {
        setAuthError("Erreur de connexion serveur. Réessayez.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const updateProfileAvatar = async (newAvatar: string) => {
     if(user) {
        await dbService.updateUserAvatar(user.uid, newAvatar);
        const updatedUser = { ...user, avatar: newAvatar };
        setUser(updatedUser);
        localStorage.setItem('g5_session_v1', JSON.stringify(updatedUser));
     }
  };

  const resetAllData = async () => {
    if (window.confirm("Réinitialiser l'application ? (Déconnexion + Nettoyage cache)")) {
      await dbService.fullReset(user?.uid);
      setUser(null);
      setPseudo("");
      setPin("");
      setInvitationCode("");
      setActiveTab(AppTab.DASHBOARD);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-black z-0" />
        <div className="w-full max-w-md glass p-10 rounded-[2.5rem] space-y-8 animate-fade-in border border-white/5 relative z-10 shadow-2xl shadow-emerald-900/10">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 transform rotate-3">
               <span className="text-4xl">🐉</span>
            </div>
            <div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">PORTAIL G5</h1>
                <p className="text-emerald-500/80 text-xs font-bold uppercase tracking-[0.2em] mt-2">Licence 1 Chinois • 2025</p>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="Votre Pseudo (ex: Thomas)"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 tracking-wide transition-all focus:bg-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input 
                    type="password" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN (4)"
                    maxLength={4}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-center tracking-widest font-mono transition-all focus:bg-slate-900"
                    required
                />
                 <input 
                  type="password" 
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="Code Promo"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-center text-xs tracking-wider transition-all focus:bg-slate-900"
                  required
                />
              </div>
            </div>

            {authError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"><p className="text-red-400 text-xs font-bold text-center uppercase">{authError}</p></div>}
            
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center ${isLoggingIn ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoggingIn ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Entrer dans le Portail"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 max-w-2xl mx-auto relative">
      <header className="sticky top-0 z-40 glass-dark px-6 py-4 flex justify-between items-center border-b border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
             <UserAvatar avatar={user.avatar} size="sm" />
             <div>
                 <h2 className="text-sm font-bold text-white tracking-wide leading-none">{user.name}</h2>
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-orange-500'}`} />
                    <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">{activeTab}</span>
                 </div>
             </div>
        </div>
        <div className="flex gap-2">
          {activeTab === AppTab.CHAT && (
            <button 
              onClick={() => { 
                if(window.confirm("Vider les messages affichés ?")) { 
                  window.dispatchEvent(new Event('trigger-chat-clear'));
                }
              }} 
              className="p-2.5 glass rounded-full text-slate-400 hover:text-red-400 transition-all hover:bg-white/5"
            >
              <Trash2 size={16} />
            </button>
          )}
          <div className="p-2.5 glass rounded-full text-slate-500 flex items-center justify-center">
             {isOnline ? <Wifi size={16} className="text-emerald-500" /> : <WifiOff size={16} className="text-orange-500" />}
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 overflow-x-hidden">
        {activeTab === AppTab.DASHBOARD && <DashboardView user={user} />}
        {activeTab === AppTab.CHAT && <ChatView currentUser={user} onMemoryUpdate={(mem) => { const u = {...user, aiMemory: mem}; setUser(u); localStorage.setItem('g5_session_v1', JSON.stringify(u)); }} />}
        {activeTab === AppTab.FILES && <FilesView user={user} />}
        {activeTab === AppTab.QUIZ && <QuizView />}
        {activeTab === AppTab.PROFILE && <ProfileView user={user} onUpdateAvatar={updateProfileAvatar} onLogout={() => { setUser(null); localStorage.removeItem('g5_session_v1'); }} onReset={resetAllData} />}
      </main>

      {/* FLOATING DOCK NAVIGATION */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto">
        <div className="glass-nav px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl ring-1 ring-white/10">
          <NavBtn active={activeTab === AppTab.DASHBOARD} icon={<LayoutDashboard size={22} strokeWidth={2.5} />} onClick={() => setActiveTab(AppTab.DASHBOARD)} />
          <NavBtn active={activeTab === AppTab.CHAT} icon={<MessageSquare size={22} strokeWidth={2.5} />} onClick={() => setActiveTab(AppTab.CHAT)} />
          <div className="w-px h-8 bg-white/10 mx-1"></div>
          <NavBtn active={activeTab === AppTab.FILES} icon={<Files size={22} strokeWidth={2.5} />} onClick={() => setActiveTab(AppTab.FILES)} />
          <NavBtn active={activeTab === AppTab.QUIZ} icon={<Gamepad2 size={22} strokeWidth={2.5} />} onClick={() => setActiveTab(AppTab.QUIZ)} />
          <div className="w-px h-8 bg-white/10 mx-1"></div>
          <NavBtn active={activeTab === AppTab.PROFILE} icon={<UserIcon size={22} strokeWidth={2.5} />} onClick={() => setActiveTab(AppTab.PROFILE)} />
        </div>
      </nav>
    </div>
  );
};

const NavBtn = ({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) => (
  <button onClick={onClick} className="relative group">
    <div className={`p-2.5 rounded-2xl transition-all duration-300 ${active ? 'text-emerald-400 bg-emerald-500/10 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
      {icon}
    </div>
    {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500"></div>}
  </button>
);

const DashboardView = ({ user }: { user: User }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [scheduleUrl, setScheduleUrl] = useState<string | null>(null);
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [loadingFortune, setLoadingFortune] = useState(false);
  
  // States pour le sélecteur de délégués
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [candidateUsers, setCandidateUsers] = useState<User[]>([]);

  // States pour la création d'annonce
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsTag, setNewsTag] = useState<'Urgent' | 'Info' | 'Examen'>('Info');
  const [newsImage, setNewsImage] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // PERMISSIONS
  const isAdmin = user.role === 'admin';
  const canManageNews = user.role === 'admin' || user.role === 'delegate';
  
  useEffect(() => {
    const unsubNews = dbService.subscribeToNews(setNews);
    const unsubDelegates = dbService.subscribeToDelegates(setDelegates);
    dbService.getScheduleImage().then(setScheduleUrl);
    return () => { unsubNews(); unsubDelegates(); };
  }, []);

  const handleCrackCookie = async () => {
    setLoadingFortune(true);
    const result = await geminiService.generateFortune();
    setFortune(result);
    setLoadingFortune(false);
  };

  const deleteNews = async (id: string) => {
    if (window.confirm("Supprimer cette actualité ?")) {
      await dbService.deleteNews(id);
    }
  };

  const openNewsModal = () => {
    setNewsTitle("");
    setNewsContent("");
    setNewsTag("Info");
    setNewsImage(null);
    setShowNewsModal(true);
  };

  const handleGenerateImage = async () => {
    if (!newsTitle || !newsContent) {
      alert("Veuillez remplir le titre et le contenu d'abord.");
      return;
    }
    setIsGeneratingImg(true);
    try {
      const img = await geminiService.generateAnnouncementImage(newsTitle, newsContent);
      if (img) {
        setNewsImage(img);
      } else {
        alert("L'IA n'a pas pu générer d'image.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur technique lors de la génération.");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const submitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.addNews({
      title: newsTitle,
      content: newsContent,
      date: Date.now(),
      tag: newsTag,
      imageUrl: newsImage || undefined
    });
    setShowNewsModal(false);
  };

  const handleScheduleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) { 
          alert("L'image est trop volumineuse (Max 2MB).");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await dbService.saveScheduleImage(base64);
        setScheduleUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const openDelegateSelection = async () => {
    const users = await dbService.getAllUsers();
    setCandidateUsers(users);
    setShowDelegateModal(true);
  };

  const handleSelectDelegate = async (candidate: User, role: string) => {
     await dbService.addDelegate({
       name: candidate.name,
       role: role,
       avatar: candidate.avatar
     });
     setShowDelegateModal(false);
  };

  const deleteDelegate = async (id: string) => {
    if(confirm("Supprimer ce délégué ?")) {
      await dbService.deleteDelegate(id);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* MODALES */}
      {showDelegateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm glass-dark rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Nommer Délégué</h3>
               <button onClick={() => setShowDelegateModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {candidateUsers.map(u => (
                <div key={u.uid} className="glass p-3 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <UserAvatar avatar={u.avatar} size="sm" className="rounded-lg" />
                      <p className="text-xs font-bold text-slate-200">{u.name}</p>
                   </div>
                   <div className="flex gap-1">
                      <button onClick={() => handleSelectDelegate(u, 'Délégué')} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold uppercase">Titulaire</button>
                      <button onClick={() => handleSelectDelegate(u, 'Suppléant')} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold uppercase">Suppléant</button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-dark rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Nouvelle Annonce</h3>
               <button onClick={() => setShowNewsModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={submitNews} className="p-6 space-y-4">
              <input type="text" value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm" placeholder="Titre" required />
              <textarea value={newsContent} onChange={(e) => setNewsContent(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm h-24" placeholder="Contenu" required />
              <div className="flex gap-2">
                  {['Info', 'Urgent', 'Examen'].map((tag) => (
                    <button key={tag} type="button" onClick={() => setNewsTag(tag as any)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${newsTag === tag ? 'bg-white/10 border-white text-white' : 'border-slate-800 text-slate-500'}`}>{tag}</button>
                  ))}
              </div>
              <div className="space-y-2">
                 {newsImage ? (
                   <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10"><img src={newsImage} alt="Preview" className="w-full h-full object-cover" /></div>
                 ) : (
                   <button type="button" onClick={handleGenerateImage} disabled={isGeneratingImg || !newsTitle} className="w-full py-4 border border-dashed border-slate-700 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500/5 transition-all text-xs font-bold uppercase text-slate-500 hover:text-emerald-400">
                      {isGeneratingImg ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Générer Image IA
                   </button>
                 )}
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">Publier</button>
            </form>
          </div>
        </div>
      )}

      {/* FORTUNE COOKIE */}
      <section className="animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
           <div className="h-px w-8 bg-amber-500/30"></div>
           <h3 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-[0.2em]">Sagesse Quotidienne</h3>
        </div>
        
        {!fortune ? (
          <button 
            onClick={handleCrackCookie}
            disabled={loadingFortune}
            className="w-full glass p-8 rounded-[2rem] border border-amber-500/10 group hover:border-amber-500/30 transition-all relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex flex-col items-center gap-4 relative z-10">
                {loadingFortune ? <Loader2 size={32} className="text-amber-400 animate-spin" /> : <div className="text-5xl group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">🥠</div>}
                <p className="text-amber-100 font-bold text-sm tracking-wide">OUVRIR LE BISCUIT</p>
             </div>
          </button>
        ) : (
          <div className="glass p-8 rounded-[2rem] border border-amber-500/20 relative overflow-hidden bg-gradient-to-b from-amber-950/20 to-transparent">
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
             <button onClick={() => setFortune(null)} className="absolute top-4 right-4 text-amber-500/50 hover:text-amber-400"><RefreshCw size={14} /></button>
             
             <div className="text-center mb-8">
               <h4 className="text-3xl md:text-4xl font-extrabold text-white tracking-wide mb-2 text-glow">{fortune.chengyu}</h4>
               <p className="text-emerald-400 font-mono text-sm opacity-80">{fortune.pinyin}</p>
               <div className="w-12 h-0.5 bg-amber-500/30 mx-auto my-4"></div>
               <p className="text-amber-100 text-sm font-medium leading-relaxed italic">"{fortune.translation}"</p>
             </div>

             <div className="bg-slate-950/40 rounded-2xl p-4 flex gap-4 items-start border border-white/5 backdrop-blur-sm">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 shrink-0 border border-amber-500/20">
                  <Dna size={18} />
                </div>
                <div>
                   <p className="text-[9px] text-amber-500/70 font-bold uppercase tracking-widest mb-1">Conseil Astral</p>
                   <p className="text-slate-300 text-xs leading-relaxed">{fortune.advice}</p>
                </div>
             </div>
          </div>
        )}
      </section>

      {/* ANNONCES */}
      <section className="space-y-5">
        <div className="flex justify-between items-end px-1">
          <div className="flex items-center gap-2">
             <div className="h-px w-8 bg-emerald-500/30"></div>
             <h3 className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.2em]">Tableau d'affichage</h3>
          </div>
          {canManageNews && <button onClick={openNewsModal} className="text-emerald-400 hover:text-white transition-colors bg-emerald-500/10 hover:bg-emerald-500 p-2 rounded-full"><PlusCircle size={16} /></button>}
        </div>

        <div className="grid gap-4">
          {news.length > 0 ? news.map(item => (
            <div key={item.id} className="glass rounded-[2rem] border border-white/5 overflow-hidden group hover:border-white/10 transition-all">
              {item.imageUrl && (
                <div className="h-40 w-full relative">
                  <img src={item.imageUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                  <div className="absolute top-4 right-4">
                     {canManageNews && <button onClick={() => deleteNews(item.id)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-red-400 border border-white/10"><Trash2 size={12} /></button>}
                  </div>
                </div>
              )}
              
              <div className="p-6 relative">
                 <div className="flex items-start justify-between mb-2">
                    <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                        item.tag === 'Urgent' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                        item.tag === 'Examen' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>{item.tag}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(item.date).toLocaleDateString()}</span>
                 </div>
                 <h4 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                 <p className="text-sm text-slate-400 leading-relaxed font-light">{item.content}</p>
              </div>
            </div>
          )) : (
            <div className="glass p-10 rounded-[2rem] text-center border-dashed border-2 border-white/5">
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Aucune annonce</p>
            </div>
          )}
        </div>
      </section>

      {/* EMPLOI DU TEMPS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-2">
             <div className="h-px w-8 bg-blue-500/30"></div>
             <h3 className="text-[10px] font-bold text-blue-500/80 uppercase tracking-[0.2em]">Planning</h3>
           </div>
           {isAdmin && (
             <div className="relative">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScheduleUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="text-blue-400 hover:text-white transition-colors p-2 bg-blue-500/10 hover:bg-blue-500 rounded-full"><Edit size={14} /></button>
             </div>
           )}
        </div>
        
        <div className="glass rounded-[2rem] overflow-hidden aspect-[16/10] relative group cursor-pointer border border-white/5 shadow-2xl">
          {scheduleUrl ? (
            <img src={scheduleUrl} alt="Schedule" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40">
                <ImageIcon size={32} className="text-slate-700 mb-2" />
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Non défini</p>
            </div>
          )}
        </div>
      </section>

      {/* DÉLÉGUÉS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-2">
             <div className="h-px w-8 bg-purple-500/30"></div>
             <h3 className="text-[10px] font-bold text-purple-500/80 uppercase tracking-[0.2em]">Représentants</h3>
           </div>
           {isAdmin && <button onClick={openDelegateSelection} className="text-purple-400 hover:text-white transition-colors p-2 bg-purple-500/10 hover:bg-purple-500 rounded-full"><UserPlus size={14} /></button>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {delegates.map((d) => (
            <div key={d.id} className="glass p-4 rounded-3xl flex items-center gap-4 border border-white/5 hover:bg-white/5 transition-all relative group">
              {isAdmin && <button onClick={() => deleteDelegate(d.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={12} /></button>}
              <UserAvatar avatar={d.avatar} size="md" className="rounded-2xl border-white/5" />
              <div>
                <p className="text-xs font-bold text-white truncate">{d.name}</p>
                <p className="text-[9px] text-purple-400 font-bold uppercase tracking-tight opacity-70">{d.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const ChatView = ({ currentUser, onMemoryUpdate }: { currentUser: User, onMemoryUpdate: (mem: string) => void }) => {
  const [mode, setMode] = useState<'public' | 'private'>('public');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsub: () => void;
    if (mode === 'public') unsub = dbService.subscribeToPublicMessages(setMessages);
    else unsub = dbService.subscribeToPrivateMessages(currentUser.uid, setMessages);
    return () => { if(unsub) unsub(); };
  }, [mode, currentUser.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleClear = () => {
       if (mode === 'public') dbService.clearPublicMessages();
       else dbService.clearPrivateMessages(currentUser.uid);
    };
    window.addEventListener('trigger-chat-clear', handleClear);
    return () => window.removeEventListener('trigger-chat-clear', handleClear);
  }, [mode, currentUser.uid]);

  const handleSend = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!input.trim()) return;
     const text = input.trim();
     setInput("");

     const msgData = { senderId: currentUser.uid, senderName: currentUser.name, senderAvatar: currentUser.avatar, text: text, timestamp: Date.now(), isAi: false };

     if (mode === 'public') await dbService.addPublicMessage(msgData);
     else {
        await dbService.addPrivateMessage(currentUser.uid, msgData);
        setIsTyping(true);
        try {
           let fullResponse = "";
           // MODIFICATION : On passe currentUser.name pour l'instruction spécifique "cher créateur"
           const stream = geminiService.streamChatResponse(text, messages, currentUser.aiMemory, currentUser.name);
           for await (const chunk of stream) fullResponse += chunk;
           await dbService.addPrivateMessage(currentUser.uid, { senderId: 'ai-tutor', senderName: 'G5-Tuteur', senderAvatar: '🤖', text: fullResponse, timestamp: Date.now(), isAi: true });
           geminiService.updateStudentProfile(currentUser.aiMemory || "", text, fullResponse).then(async (newMemory) => {
             if (newMemory !== currentUser.aiMemory) { await dbService.updateUserAiMemory(currentUser.uid, newMemory); onMemoryUpdate(newMemory); }
           });
        } catch (err) { console.error(err); } finally { setIsTyping(false); }
     }
  };

  const deleteMessage = async (msgId: string) => {
      if(window.confirm("Supprimer ce message pour tout le monde ?")) {
          if (mode === 'public') await dbService.deletePublicMessage(msgId);
          // Pour le privé, on permet aussi la suppression, bien que techniquement moins critique pour "tout le monde"
          else await dbService.clearPrivateMessages(currentUser.uid); // Simplification: le chat privé est souvent nettoyé en bloc, mais ici on pourrait implémenter une suppression unitaire si besoin.
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
       <div className="flex bg-slate-950 p-1.5 rounded-full mb-6 border border-white/5 relative shadow-inner">
          <button onClick={() => setMode('public')} className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'public' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Groupe</button>
          <button onClick={() => setMode('private')} className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'private' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-emerald-600 hover:text-emerald-400'}`}>Tuteur IA</button>
       </div>
       
       {mode === 'private' && currentUser.aiMemory && (
         <div className="mb-4 px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-3 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <p className="text-[10px] text-blue-300/80 truncate font-mono">Contextualisation active...</p>
         </div>
       )}

       <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          {messages.map((m) => {
             const isOwn = m.senderId === currentUser.uid;
             return (
             <div key={m.id} className={`flex gap-4 ${isOwn ? 'flex-row-reverse' : ''} animate-fade-in group`}>
                <UserAvatar avatar={m.senderAvatar} className={`shrink-0 ${m.isAi ? 'border-emerald-500/30' : 'border-white/10'}`} size="md" />
                <div className="relative max-w-[80%]">
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm ${
                        isOwn ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm border border-blue-500/50' : 
                        m.isAi ? 'bg-slate-900/80 border border-emerald-500/20 text-emerald-50 rounded-tl-sm' : 
                        'bg-slate-900/80 border border-white/10 text-slate-200 rounded-tl-sm'
                        }`}>
                        {!m.isAi && !isOwn && <p className="text-[9px] font-bold opacity-50 mb-1 uppercase tracking-wider">{m.senderName}</p>}
                        <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert prose-p:my-1 prose-headings:text-emerald-400 prose-strong:text-white prose-sm max-w-none">{m.text}</ReactMarkdown>
                    </div>
                    {/* Bouton de suppression pour ses propres messages */}
                    {isOwn && !m.isAi && mode === 'public' && (
                        <button 
                            onClick={() => deleteMessage(m.id)}
                            className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 bg-red-500/10 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                            title="Supprimer pour tout le monde"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
             </div>
          )})}
          {isTyping && (
             <div className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-900/50 flex items-center justify-center text-lg border border-emerald-500/30">🤖</div>
                <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75" />
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150" />
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
       </div>

       <form onSubmit={handleSend} className="mt-4 relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'public' ? "Message au groupe..." : "Posez une question..."}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-5 pr-12 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm placeholder:text-slate-600 shadow-xl backdrop-blur-md transition-all focus:bg-slate-900"
          />
          <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-2 p-2 bg-emerald-600 rounded-xl text-white disabled:opacity-50 disabled:bg-transparent transition-all hover:scale-105 active:scale-95 shadow-lg">
             <Send size={18} />
          </button>
       </form>
    </div>
  );
};

const FilesView = ({ user }: { user: User }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [category, setCategory] = useState<'all' | 'cours' | 'td' | 'examen'>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<'cours' | 'td' | 'examen' | 'autre'>('cours');
  const [newType, setNewType] = useState("PDF");

  const isAdminOrDelegate = user.role === 'admin' || user.role === 'delegate';

  useEffect(() => { return dbService.subscribeToResources(setResources); }, []);
  const filtered = category === 'all' ? resources : resources.filter(r => r.category === category);

  const handleAdd = async (e: React.FormEvent) => {
     e.preventDefault();
     await dbService.addResource({ title: newTitle, category: newCategory, type: newType, size: 'Unknown', date: Date.now(), author: user.name, url: '#' });
     setShowUpload(false); setNewTitle("");
  };
  
  const handleDelete = async (id: string) => { if(confirm("Supprimer ?")) await dbService.deleteResource(id); };

  return (
    <div className="space-y-6 pb-20">
       <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'cours', 'td', 'examen'].map(c => (
             <button key={c} onClick={() => setCategory(c as any)} className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${category === c ? 'bg-white text-black border-white shadow-lg' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}>
               {c === 'all' ? 'Tout' : c}
             </button>
          ))}
       </div>

       {isAdminOrDelegate && (
          <button onClick={() => setShowUpload(!showUpload)} className="w-full py-4 border border-dashed border-slate-700 rounded-[2rem] flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
             <PlusCircle size={18} /> <span className="text-xs font-bold uppercase tracking-widest">Uploader</span>
          </button>
       )}

       {showUpload && (
          <form onSubmit={handleAdd} className="glass p-6 rounded-[2rem] space-y-4 animate-fade-in border border-white/10">
             <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titre" className="w-full bg-slate-900/50 rounded-xl px-4 py-3 text-sm text-white border border-slate-700" required />
             <div className="flex gap-3">
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="bg-slate-900/50 rounded-xl px-4 py-3 text-xs text-slate-300 border border-slate-700 outline-none">
                   <option value="cours">Cours</option><option value="td">TD</option><option value="examen">Examen</option><option value="autre">Autre</option>
                </select>
                <input type="text" value={newType} onChange={e => setNewType(e.target.value)} placeholder="Ext (PDF)" className="flex-1 bg-slate-900/50 rounded-xl px-4 py-3 text-xs text-white border border-slate-700" />
             </div>
             <button type="submit" className="w-full bg-emerald-600 py-3 rounded-xl text-xs font-bold uppercase text-white shadow-lg">Valider</button>
          </form>
       )}

       <div className="grid gap-3">
          {filtered.map(r => (
             <div key={r.id} className="glass p-4 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-colors border border-white/5">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 font-black text-[10px] border border-white/5 shadow-inner">
                      {r.type}
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-200 text-sm">{r.title}</h4>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wide mt-1 flex items-center gap-1">
                        <UserIcon size={10} /> {r.author} <span className="text-slate-700">•</span> {new Date(r.date).toLocaleDateString()}
                      </p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <a href={r.url} className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-600 transition-all shadow-md"><Download size={16} /></a>
                   {isAdminOrDelegate && <button onClick={() => handleDelete(r.id)} className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>}
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

interface Card { id: number; content: string; type: 'hanzi' | 'def'; pairId: string; isFlipped: boolean; isMatched: boolean; }

const QuizView = () => {
  const [viewMode, setViewMode] = useState<'menu' | 'quiz' | 'memory'>('menu');
  const [topic, setTopic] = useState("");
  // Quiz
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  // Memory
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => { let interval: any; if (isTimerRunning) interval = setInterval(() => setTimer(t => t + 1), 1000); return () => clearInterval(interval); }, [isTimerRunning]);

  const startQuiz = async (e: React.FormEvent) => {
     e.preventDefault(); if (!topic) return; setLoading(true);
     const qs = await geminiService.generateQuiz(topic);
     if (qs.length > 0) { setQuestions(qs); setCurrentIndex(0); setScore(0); setShowResult(false); setSelectedAnswer(null); setIsAnswerChecked(false); setViewMode('quiz'); }
     setLoading(false);
  };

  const startMemory = async (e: React.FormEvent) => {
    e.preventDefault(); if (!topic) return; setLoading(true);
    const pairs = await geminiService.generateMemoryPairs(topic);
    if (pairs.length > 0) {
      const deck: Card[] = [];
      pairs.forEach((p, idx) => {
        deck.push({ id: idx * 2, content: p.hanzi, type: 'hanzi', pairId: p.id, isFlipped: false, isMatched: false });
        deck.push({ id: idx * 2 + 1, content: `${p.pinyin}\n${p.translation}`, type: 'def', pairId: p.id, isFlipped: false, isMatched: false });
      });
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      setCards(deck); setTimer(0); setIsTimerRunning(true); setFlippedIndices([]); setViewMode('memory');
    }
    setLoading(false);
  };

  const handleMemoryClick = (index: number) => {
    if (flippedIndices.length >= 2 || cards[index].isFlipped || cards[index].isMatched) return;
    const newCards = [...cards]; newCards[index].isFlipped = true; setCards(newCards);
    const newFlipped = [...flippedIndices, index]; setFlippedIndices(newFlipped);
    if (newFlipped.length === 2) {
      const [idx1, idx2] = newFlipped;
      if (newCards[idx1].pairId === newCards[idx2].pairId) {
        setTimeout(() => {
          newCards[idx1].isMatched = true; newCards[idx2].isMatched = true; setCards([...newCards]); setFlippedIndices([]);
          if (newCards.every(c => c.isMatched)) setIsTimerRunning(false);
        }, 500);
      } else {
        setTimeout(() => { newCards[idx1].isFlipped = false; newCards[idx2].isFlipped = false; setCards([...newCards]); setFlippedIndices([]); }, 1000);
      }
    }
  };

  const handleQuizAnswer = (index: number) => {
     if (isAnswerChecked) return; setSelectedAnswer(index); setIsAnswerChecked(true);
     if (index === questions[currentIndex].correctAnswer) setScore(s => s + 1);
  };

  const nextQuestion = () => {
     if (currentIndex < questions.length - 1) { setCurrentIndex(c => c + 1); setSelectedAnswer(null); setIsAnswerChecked(false); } 
     else setShowResult(true);
  };

  const resetGame = () => { setViewMode('menu'); setTopic(""); };

  if (loading) return (
     <div className="flex flex-col items-center justify-center h-64 space-y-6">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xl">🐲</div>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 animate-pulse">Consultation des archives...</p>
     </div>
  );

  if (viewMode === 'menu') {
    return (
      <div className="space-y-8 pt-6 animate-fade-in">
        <div className="text-center space-y-2 mb-8">
           <div className="inline-block p-4 rounded-full bg-slate-900 border border-white/5 shadow-2xl mb-2">
              <Gamepad2 className="text-purple-500" size={32} />
           </div>
           <h2 className="text-3xl font-extrabold text-white tracking-tight">Arcade</h2>
           <p className="text-slate-400 text-sm font-medium">Entraînement cognitif augmenté</p>
        </div>

        <div className="grid gap-6">
          <div className="glass p-8 rounded-[2rem] border border-white/5 hover:border-purple-500/30 transition-all group">
             <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors"><ListChecks size={24} /></div>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Quiz Rapide</h3>
             <p className="text-sm text-slate-400 mb-6 leading-relaxed">Génération procédurale de QCM. Testez vos connaissances grammaticales.</p>
             <form onSubmit={startQuiz} className="flex gap-3">
                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Sujet (ex: Verbes)" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/40" required />
                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all transform active:scale-95">Go</button>
             </form>
          </div>

          <div className="glass p-8 rounded-[2rem] border border-white/5 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
             <div className="absolute -right-10 -top-10 opacity-5"><Grid3X3 size={200} /></div>
             <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Grid3X3 size={24} /></div>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Mémoire Impériale</h3>
             <p className="text-sm text-slate-400 mb-6 leading-relaxed">Association Hanzi-Définition contre la montre. Améliorez votre rétention visuelle.</p>
             <form onSubmit={startMemory} className="flex gap-3 relative z-10">
                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Thème (ex: Famille)" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/40" required />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95">Jouer</button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'memory') {
    const isVictory = cards.length > 0 && cards.every(c => c.isMatched);
    if (isVictory) return (
       <div className="text-center space-y-8 py-20 animate-fade-in">
          <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-bounce">
             <span className="text-6xl">🀄️</span>
          </div>
          <div>
             <h2 className="text-4xl font-extrabold text-white mb-2">Victoire !</h2>
             <div className="inline-block px-6 py-2 rounded-full bg-slate-800 border border-emerald-500/30 text-emerald-400 font-mono text-xl">{timer}s</div>
          </div>
          <button onClick={resetGame} className="px-10 py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors shadow-xl">Retour</button>
       </div>
    );

    return (
      <div className="pb-24 space-y-6 animate-fade-in">
        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md sticky top-20 z-20 shadow-lg">
          <button onClick={resetGame} className="text-slate-400 hover:text-white text-xs font-bold uppercase flex items-center gap-2"><ChevronRight className="rotate-180" size={14} /> Abandonner</button>
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-lg"><Timer size={18} /> {timer}s</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => handleMemoryClick(index)}
              className={`aspect-[3/4] rounded-xl flex items-center justify-center p-2 text-center transition-all duration-500 transform-style-3d ${
                card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
              } ${card.isMatched ? 'opacity-0 scale-90 pointer-events-none delay-500' : ''}`}
              style={{ perspective: '1000px' }}
            >
               <div className={`w-full h-full rounded-xl flex items-center justify-center shadow-xl transition-all ${card.isFlipped || card.isMatched ? 'tile-card' : 'tile-card-back'}`}>
                  {card.isFlipped || card.isMatched ? (
                    <span className={`${card.type === 'hanzi' ? 'text-3xl font-serif text-slate-800' : 'text-xs font-bold text-slate-600 whitespace-pre-line leading-tight'}`}>{card.content}</span>
                  ) : (
                    <span className="text-2xl opacity-40 mix-blend-overlay">🐲</span>
                  )}
               </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Quiz Mode Display (Simplified for brevity but styled)
  if (showResult) return (
     <div className="text-center space-y-8 py-20 animate-fade-in">
        <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(147,51,234,0.4)]">
           <span className="text-6xl">🏆</span>
        </div>
        <div>
           <h2 className="text-3xl font-black text-white">Session Terminée</h2>
           <p className="text-slate-400 mt-2 text-lg">Score Final : <span className="text-purple-400 font-bold">{score} / {questions.length}</span></p>
        </div>
        <button onClick={resetGame} className="px-10 py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">Terminer</button>
     </div>
  );

  const q = questions[currentIndex];
  return (
     <div className="space-y-8 animate-fade-in pb-24">
        <div className="flex justify-between items-center px-2">
           <button onClick={resetGame} className="p-2 bg-slate-800 rounded-full hover:bg-white text-slate-400 hover:text-black transition-all"><X size={16} /></button>
           <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question {currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="glass p-8 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
           <h3 className="text-xl md:text-2xl font-bold text-white leading-relaxed">{q.question}</h3>
        </div>
        <div className="grid gap-3">
           {q.options.map((opt, idx) => {
              let style = "bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-white/5 hover:border-slate-600";
              if (isAnswerChecked) {
                 if (idx === q.correctAnswer) style = "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                 else if (idx === selectedAnswer) style = "bg-red-500/20 border-red-500 text-red-400";
                 else style = "opacity-40 bg-slate-900/20 border-transparent";
              }
              return (
                 <button key={idx} onClick={() => handleQuizAnswer(idx)} disabled={isAnswerChecked} className={`w-full p-5 rounded-2xl border text-left text-sm font-medium transition-all ${style} flex items-center gap-4`}>
                    <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px] font-bold opacity-60">{String.fromCharCode(65 + idx)}</div>
                    {opt}
                 </button>
              );
           })}
        </div>
        {isAnswerChecked && (
           <div className="fixed bottom-24 left-4 right-4 animate-fade-in">
              <div className="glass-dark p-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 max-w-2xl mx-auto">
                 <div className="text-xs text-slate-300 pl-2 border-l-2 border-emerald-500"><span className="font-bold text-emerald-400 block mb-0.5">Réponse :</span>{q.explanation}</div>
                 <button onClick={nextQuestion} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg shrink-0"><ChevronRight size={20} /></button>
              </div>
           </div>
        )}
     </div>
  );
};

const ProfileView = ({ user, onLogout, onUpdateAvatar, onReset }: { user: User, onLogout: () => void, onUpdateAvatar: (url: string) => void, onReset: () => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if(file.size > 2000000) {
         alert("Image trop lourde (Max 2MB)");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
         const result = reader.result as string;
         onUpdateAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pt-6">
       <div className="text-center relative">
          <div className="relative inline-block group">
             <UserAvatar avatar={user.avatar} size="xl" className="border-4 border-slate-950 shadow-2xl relative z-10" />
             <button 
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 p-2 bg-emerald-600 rounded-full text-white shadow-lg hover:bg-emerald-500 transition-all z-20 group-hover:scale-110"
             >
                <Camera size={16} />
             </button>
             <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/20 blur-xl rounded-full z-0"></div>
          <div className="mt-4">
             <h2 className="text-2xl font-black text-white tracking-tight">{user.name}</h2>
             <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-emerald-400">{user.role}</span>
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400">{user.uid}</span>
             </div>
          </div>
       </div>

       <div className="glass rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
          <div className="p-8 space-y-6">
             <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><BrainCircuit size={24} /></div>
                <div className="flex-1">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Mémoire Cognitive (IA)</p>
                   <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-xs text-slate-300 leading-relaxed font-mono">
                      {user.aiMemory || "Aucune donnée cognitive enregistrée."}
                   </div>
                </div>
             </div>
             
             <div className="h-px bg-white/5"></div>

             <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-2xl text-slate-400"><ShieldAlert size={24} /></div>
                <div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sécurité</p>
                   <p className="text-white font-mono text-sm">PIN : ••••</p>
                </div>
             </div>
          </div>
          <div className="bg-white/5 p-2"></div>
       </div>

       <div className="grid gap-3">
          <button onClick={onLogout} className="w-full p-5 glass rounded-[2rem] flex items-center justify-between group hover:bg-red-500/5 hover:border-red-500/20 transition-all border border-white/5">
             <span className="font-bold text-slate-300 group-hover:text-red-400 transition-colors pl-2">Se Déconnecter</span>
             <div className="p-2 bg-slate-800 rounded-full text-slate-500 group-hover:text-red-400 group-hover:bg-red-500/10 transition-all"><LogOut size={18} /></div>
          </button>
          
          <button onClick={onReset} className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-red-500 transition-colors flex items-center justify-center gap-2 opacity-60 hover:opacity-100">
             <RefreshCw size={12} /> Reset System
          </button>
       </div>
    </div>
  );
};

export default App;
