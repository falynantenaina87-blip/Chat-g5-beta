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
  Loader2
} from 'lucide-react';
import { AppTab, User, Message, QuizQuestion, NewsItem, Resource, Delegate } from './types';
import { geminiService } from './services/geminiService';
import { dbService } from './services/db';

const INVITATION_CODE = "G5L1-2025-CHINE-X";
const ADMIN_CODE = "ADMIN-G5-MASTER";

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
      } else {
        setAuthError("Erreur de connexion serveur. Réessayez.");
      }
    } finally {
      setIsLoggingIn(false);
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617]">
        <div className="w-full max-w-md glass p-10 rounded-[2.5rem] space-y-8 animate-fade-in border border-white/10">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
               <BookOpen className="text-emerald-500" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">PORTAIL G5</h1>
            <p className="text-slate-400 text-sm font-medium">Licence 1 Chinois • Promotion 2025</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Votre Pseudo</label>
                <input 
                  type="text" 
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="Ex: Thomas G."
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 tracking-wide"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Code PIN (4 chiffres)</label>
                <input 
                  type="password" 
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-center tracking-widest font-mono"
                  required
                />
                <p className="text-[9px] text-slate-500 text-center">Créez-le si c'est votre première fois, ou entrez-le pour vous reconnecter.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clé d'accès promotionnelle</label>
                <input 
                  type="password" 
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="••••-••••-••••"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-center tracking-widest font-mono"
                  required
                />
              </div>
            </div>

            {authError && <p className="text-red-400 text-[10px] font-bold text-center uppercase animate-pulse">{authError}</p>}
            
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className={`w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center ${isLoggingIn ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Accéder au portail"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto relative bg-[#020617]">
      <header className="sticky top-0 z-40 glass-dark px-6 py-5 flex justify-between items-center border-b border-white/5">
        <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2 uppercase">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`} />
          {activeTab}
        </h2>
        <div className="flex gap-2">
          {activeTab === AppTab.CHAT && (
            <button 
              onClick={() => { 
                if(window.confirm("Vider les messages affichés ?")) { 
                  window.dispatchEvent(new Event('trigger-chat-clear'));
                }
              }} 
              className="p-2.5 glass rounded-2xl text-slate-400 hover:text-red-400 transition-all"
              title="Nettoyer le chat"
            >
              <Trash2 size={18} />
            </button>
          )}
          <div className="p-2.5 glass rounded-2xl text-slate-500 flex items-center justify-center">
             {isOnline ? <Wifi size={18} className="text-emerald-500" /> : <WifiOff size={18} className="text-orange-500" />}
          </div>
        </div>
      </header>

      <main className="p-4 overflow-x-hidden">
        {activeTab === AppTab.DASHBOARD && <DashboardView user={user} />}
        {activeTab === AppTab.CHAT && <ChatView currentUser={user} />}
        {activeTab === AppTab.FILES && <FilesView user={user} />}
        {activeTab === AppTab.QUIZ && <QuizView />}
        {activeTab === AppTab.PROFILE && <ProfileView user={user} onLogout={() => { setUser(null); localStorage.removeItem('g5_session_v1'); }} onReset={resetAllData} />}
      </main>

      <nav className="fixed bottom-6 left-4 right-4 z-50 glass-dark border border-white/10 rounded-[2rem] safe-bottom max-w-2xl mx-auto shadow-2xl overflow-hidden">
        <div className="flex justify-around items-center h-20 px-4">
          <NavBtn active={activeTab === AppTab.DASHBOARD} icon={<LayoutDashboard size={20} />} label="Home" onClick={() => setActiveTab(AppTab.DASHBOARD)} />
          <NavBtn active={activeTab === AppTab.CHAT} icon={<MessageSquare size={20} />} label="Chat" onClick={() => setActiveTab(AppTab.CHAT)} />
          <NavBtn active={activeTab === AppTab.FILES} icon={<Files size={20} />} label="Docs" onClick={() => setActiveTab(AppTab.FILES)} />
          <NavBtn active={activeTab === AppTab.QUIZ} icon={<Gamepad2 size={20} />} label="Quiz" onClick={() => setActiveTab(AppTab.QUIZ)} />
          <NavBtn active={activeTab === AppTab.PROFILE} icon={<UserIcon size={20} />} label="Moi" onClick={() => setActiveTab(AppTab.PROFILE)} />
        </div>
      </nav>
    </div>
  );
};

const NavBtn = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all duration-300 ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
    <div className={`p-2 rounded-2xl transition-all duration-500 ${active ? 'bg-emerald-500/15 scale-110' : 'hover:bg-white/5'}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

const DashboardView = ({ user }: { user: User }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [scheduleUrl, setScheduleUrl] = useState<string | null>(null);
  
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
        alert("L'IA n'a pas pu générer d'image. Le service est peut-être saturé ou le contenu a été filtré. Réessayez.");
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
      if (file.size > 2000000) { // 2MB limit for localStorage/safety
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
       avatar: role === 'Suppléant' ? '👨‍🎓' : '👩‍🎓'
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
      {/* MODALE DE SÉLECTION DÉLÉGUÉ */}
      {showDelegateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-dark bg-[#020617] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
               <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <UserPlus size={16} className="text-purple-500" /> Nommer Délégué
               </h3>
               <button onClick={() => setShowDelegateModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                 <X size={16} />
               </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {candidateUsers.length > 0 ? candidateUsers.map(u => (
                <div key={u.uid} className="glass p-3 rounded-2xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg">{u.avatar}</div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{u.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase">{u.role}</p>
                      </div>
                   </div>
                   <div className="flex gap-1">
                      <button onClick={() => handleSelectDelegate(u, 'Délégué')} className="px-2 py-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-lg text-[9px] font-black uppercase transition-colors">
                        Titulaire
                      </button>
                      <button onClick={() => handleSelectDelegate(u, 'Suppléant')} className="px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg text-[9px] font-black uppercase transition-colors">
                        Suppléant
                      </button>
                   </div>
                </div>
              )) : (
                 <p className="text-center text-slate-500 text-xs py-4">Aucun utilisateur trouvé.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CRÉATION D'ANNONCE */}
      {showNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-dark bg-[#020617] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
               <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <Bell size={16} className="text-emerald-500" /> Nouvelle Annonce
               </h3>
               <button onClick={() => setShowNewsModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                 <X size={16} />
               </button>
            </div>
            
            <form onSubmit={submitNews} className="overflow-y-auto p-6 space-y-5 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Titre</label>
                <input 
                  type="text" 
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
                  placeholder="Ex: Examen HSK 1"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contenu</label>
                <textarea 
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm h-24 resize-none"
                  placeholder="Détails de l'annonce..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Type</label>
                <div className="flex gap-2">
                  {['Info', 'Urgent', 'Examen'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewsTag(tag as any)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        newsTag === tag 
                          ? (tag === 'Urgent' ? 'bg-red-500/20 border-red-500 text-red-400' : tag === 'Examen' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-blue-500/20 border-blue-500 text-blue-400')
                          : 'border-slate-800 text-slate-600 hover:bg-white/5'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex justify-between items-center">
                    Illustration
                    {newsImage && <button type="button" onClick={() => setNewsImage(null)} className="text-red-400 hover:text-red-300">Supprimer</button>}
                 </label>
                 
                 {newsImage ? (
                   <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group">
                      <img src={newsImage} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="text-emerald-500" size={32} />
                      </div>
                   </div>
                 ) : (
                   <button 
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImg || !newsTitle}
                    className="w-full py-6 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {isGeneratingImg ? (
                        <Loader2 className="animate-spin text-emerald-500" size={24} />
                      ) : (
                        <Sparkles className="text-slate-600 group-hover:text-emerald-500 transition-colors" size={24} />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-emerald-400">
                        {isGeneratingImg ? "Génération IA en cours..." : "Générer une image via IA"}
                      </span>
                   </button>
                 )}
                 <p className="text-[9px] text-slate-600 text-center">Utilise Gemini 2.5 Flash Image pour créer une illustration contextuelle.</p>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <PlusCircle size={18} /> Publier l'annonce
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECTION ANNONCES */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Bell size={14} className="text-emerald-500" /> Annonces Globales
          </h3>
          {canManageNews && (
            <button onClick={openNewsModal} className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              <PlusCircle size={10} /> Créer
            </button>
          )}
        </div>
        <div className="space-y-3">
          {news.length > 0 ? news.map(item => (
            <div key={item.id} className="glass rounded-3xl border border-white/5 hover:border-emerald-500/20 transition-all group relative overflow-hidden">
              {item.imageUrl && (
                <div className="h-32 w-full relative">
                  <img src={item.imageUrl} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent" />
                </div>
              )}
              
              <div className="p-5 relative">
                {canManageNews && (
                  <button onClick={() => deleteNews(item.id)} className="absolute top-4 right-4 p-2 bg-slate-900/50 rounded-xl text-slate-400 hover:text-red-400 transition-colors z-10 border border-white/5">
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${
                    item.tag === 'Urgent' ? 'bg-red-500/10 text-red-400' : 
                    item.tag === 'Examen' ? 'bg-purple-500/10 text-purple-400' : 
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {item.tag}
                  </span>
                  <span className="text-[9px] font-bold text-slate-600 uppercase">{new Date(item.date).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-slate-100 text-base group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{item.content}</p>
              </div>
            </div>
          )) : (
            <div className="glass p-10 rounded-3xl text-center border-dashed border-2 border-slate-800/50">
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Aucune annonce pour le moment</p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION EMPLOI DU TEMPS */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <BookOpen size={14} className="text-blue-500" /> Planning Hebdomadaire
           </h3>
           {isAdmin && (
             <div className="relative">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleScheduleUpload}
                />
                <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                  <Edit size={10} /> Modifier Image
                </button>
             </div>
           )}
        </div>
        
        <div className="glass rounded-[2rem] overflow-hidden aspect-[16/10] relative group cursor-pointer border border-white/5">
          {scheduleUrl ? (
            <img src={scheduleUrl} alt="Emploi du temps" className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10" />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20">
                <ImageIcon size={40} className="text-slate-800" />
              </div>
              <div className="absolute bottom-6 left-6 z-20 space-y-1">
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Aucune image</p>
                <p className="text-white font-bold">L'emploi du temps n'a pas été défini</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* SECTION DÉLÉGUÉS */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} className="text-purple-500" /> Délégués du Groupe
           </h3>
           {isAdmin && (
            <button onClick={openDelegateSelection} className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
              <UserPlus size={10} /> Nommer
            </button>
           )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {delegates.length > 0 ? delegates.map((d) => (
            <div key={d.id} className="glass-dark p-4 rounded-3xl flex items-center gap-4 border border-white/5 relative group">
              {isAdmin && (
                <button onClick={() => deleteDelegate(d.id)} className="absolute top-2 right-2 p-1.5 bg-slate-900 text-slate-500 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                   <Trash2 size={10} />
                </button>
              )}
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-2xl shadow-inner shrink-0">
                {d.avatar}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-200 truncate">{d.name}</p>
                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-tight">{d.role}</p>
              </div>
            </div>
          )) : (
            <div className="col-span-2 glass p-6 rounded-3xl text-center border-dashed border-2 border-slate-800/50">
               <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Aucun délégué nommé</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const ChatView = ({ currentUser }: { currentUser: User }) => {
  const [mode, setMode] = useState<'public' | 'private'>('public');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsub: () => void;
    if (mode === 'public') {
       unsub = dbService.subscribeToPublicMessages(setMessages);
    } else {
       unsub = dbService.subscribeToPrivateMessages(currentUser.uid, setMessages);
    }
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

     const msgData = {
       senderId: currentUser.uid,
       senderName: currentUser.name,
       senderAvatar: currentUser.avatar,
       text: text,
       timestamp: Date.now(),
       isAi: false
     };

     if (mode === 'public') {
        await dbService.addPublicMessage(msgData);
     } else {
        await dbService.addPrivateMessage(currentUser.uid, msgData);
        setIsTyping(true);
        
        try {
           let fullResponse = "";
           // Passage de l'historique (messages existants) au service pour le contexte
           const stream = geminiService.streamChatResponse(text, messages);
           for await (const chunk of stream) {
             fullResponse += chunk;
           }
           
           await dbService.addPrivateMessage(currentUser.uid, {
             senderId: 'ai-tutor',
             senderName: 'G5-Tuteur',
             senderAvatar: '🤖',
             text: fullResponse,
             timestamp: Date.now(),
             isAi: true
           });
        } catch (err) {
           console.error(err);
        } finally {
           setIsTyping(false);
        }
     }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
       <div className="flex bg-slate-900/50 p-1 rounded-2xl mb-4 border border-white/5">
          <button onClick={() => setMode('public')} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'public' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Groupe</button>
          <button onClick={() => setMode('private')} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'private' ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-600 hover:text-emerald-400'}`}>Tuteur IA</button>
       </div>

       <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((m) => (
             <div key={m.id} className={`flex gap-3 ${m.senderId === currentUser.uid ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm border border-white/10 shrink-0">
                   {m.senderAvatar}
                </div>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed ${
                   m.senderId === currentUser.uid ? 'bg-blue-600 text-white rounded-tr-sm' : 
                   m.isAi ? 'bg-emerald-900/40 border border-emerald-500/20 text-emerald-100 rounded-tl-sm' : 
                   'bg-slate-800 text-slate-200 rounded-tl-sm'
                }`}>
                   <p className="text-[9px] font-black opacity-50 mb-1 uppercase tracking-wider">{m.senderName}</p>
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                </div>
             </div>
          ))}
          {isTyping && (
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-sm border border-emerald-500/20">🤖</div>
                <div className="bg-emerald-900/20 border border-emerald-500/10 p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
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
            placeholder={mode === 'public' ? "Message au groupe..." : "Pose une question au tuteur..."}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl pl-4 pr-12 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm placeholder:text-slate-600"
          />
          <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-2 p-1.5 bg-emerald-600 rounded-xl text-white disabled:opacity-50 disabled:bg-slate-700 transition-all hover:scale-105 active:scale-95">
             <Send size={16} />
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

  useEffect(() => {
     return dbService.subscribeToResources(setResources);
  }, []);

  const filtered = category === 'all' ? resources : resources.filter(r => r.category === category);

  const handleAdd = async (e: React.FormEvent) => {
     e.preventDefault();
     await dbService.addResource({
        title: newTitle,
        category: newCategory,
        type: newType,
        size: 'Unknown',
        date: Date.now(),
        author: user.name,
        url: '#' 
     });
     setShowUpload(false);
     setNewTitle("");
  };
  
  const handleDelete = async (id: string) => {
     if(confirm("Supprimer ce fichier ?")) await dbService.deleteResource(id);
  };

  return (
    <div className="space-y-6 pb-20">
       <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'cours', 'td', 'examen'].map(c => (
             <button key={c} onClick={() => setCategory(c as any)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${category === c ? 'bg-white text-black border-white' : 'border-white/10 text-slate-500 hover:border-white/30'}`}>
               {c === 'all' ? 'Tout' : c}
             </button>
          ))}
       </div>

       {isAdminOrDelegate && (
          <button onClick={() => setShowUpload(!showUpload)} className="w-full py-3 border border-dashed border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all group">
             <PlusCircle size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Ajouter un fichier</span>
          </button>
       )}

       {showUpload && (
          <form onSubmit={handleAdd} className="glass p-4 rounded-2xl space-y-3 animate-fade-in border border-white/10">
             <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titre du fichier" className="w-full bg-slate-900/50 rounded-xl px-3 py-2 text-sm text-white border border-slate-700" required />
             <div className="flex gap-2">
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="bg-slate-900/50 rounded-xl px-3 py-2 text-xs text-slate-300 border border-slate-700">
                   <option value="cours">Cours</option>
                   <option value="td">TD</option>
                   <option value="examen">Examen</option>
                   <option value="autre">Autre</option>
                </select>
                <input type="text" value={newType} onChange={e => setNewType(e.target.value)} placeholder="Type (PDF, DOC...)" className="flex-1 bg-slate-900/50 rounded-xl px-3 py-2 text-xs text-white border border-slate-700" />
             </div>
             <button type="submit" className="w-full bg-emerald-600 py-2 rounded-xl text-xs font-bold uppercase text-white">Confirmer</button>
          </form>
       )}

       <div className="space-y-3">
          {filtered.map(r => (
             <div key={r.id} className="glass p-4 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-colors border border-white/5">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs border border-white/5">
                      {r.type}
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-200 text-sm">{r.title}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{r.author} • {r.size} • {new Date(r.date).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <a href={r.url} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <Download size={16} />
                   </a>
                   {isAdminOrDelegate && (
                      <button onClick={() => handleDelete(r.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                         <Trash2 size={16} />
                      </button>
                   )}
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

const QuizView = () => {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  const startQuiz = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!topic) return;
     setLoading(true);
     const qs = await geminiService.generateQuiz(topic);
     if (qs.length > 0) {
        setQuestions(qs);
        setCurrentIndex(0);
        setScore(0);
        setShowResult(false);
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
     } else {
        alert("Erreur lors de la génération. Réessayez.");
     }
     setLoading(false);
  };

  const handleAnswer = (index: number) => {
     if (isAnswerChecked) return;
     setSelectedAnswer(index);
     setIsAnswerChecked(true);
     if (index === questions[currentIndex].correctAnswer) {
        setScore(s => s + 1);
     }
  };

  const nextQuestion = () => {
     if (currentIndex < questions.length - 1) {
        setCurrentIndex(c => c + 1);
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
     } else {
        setShowResult(true);
     }
  };

  if (loading) return (
     <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Génération du Quiz...</p>
     </div>
  );

  if (showResult) return (
     <div className="text-center space-y-6 py-10 animate-fade-in">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
           <span className="text-4xl">🏆</span>
        </div>
        <div>
           <h2 className="text-2xl font-black text-white">Quiz Terminé !</h2>
           <p className="text-slate-400 mt-2">Score : <span className="text-emerald-400 font-bold text-xl">{score} / {questions.length}</span></p>
        </div>
        <button onClick={() => setQuestions([])} className="px-8 py-3 bg-slate-800 rounded-xl text-white font-bold uppercase tracking-widest text-xs hover:bg-slate-700 transition-colors">
           Nouveau Quiz
        </button>
     </div>
  );

  if (questions.length === 0) return (
     <div className="space-y-6 pt-10">
        <div className="text-center space-y-2">
           <Gamepad2 className="mx-auto text-purple-500 mb-4" size={40} />
           <h2 className="text-xl font-black text-white">Générateur de Quiz</h2>
           <p className="text-slate-400 text-sm">Révisez vos caractères et votre grammaire avec l'IA.</p>
        </div>
        <form onSubmit={startQuiz} className="space-y-4">
           <input 
              type="text" 
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Sujet (ex: HSK 1, Famille, Verbes...)"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              required
           />
           <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95">
              Lancer le défi
           </button>
        </form>
     </div>
  );

  const q = questions[currentIndex];

  return (
     <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
           <span>Question {currentIndex + 1}/{questions.length}</span>
           <span>Score: {score}</span>
        </div>
        
        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
           <div className="absolute top-0 left-0 h-1 bg-purple-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
           <h3 className="text-lg font-bold text-white leading-relaxed">{q.question}</h3>
        </div>

        <div className="space-y-3">
           {q.options.map((opt, idx) => {
              let stateStyle = "bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-white/5";
              if (isAnswerChecked) {
                 if (idx === q.correctAnswer) stateStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                 else if (idx === selectedAnswer) stateStyle = "bg-red-500/20 border-red-500 text-red-400";
                 else stateStyle = "opacity-50 bg-slate-900/50 border-slate-800";
              }
              
              return (
                 <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={isAnswerChecked}
                    className={`w-full p-4 rounded-2xl border text-left text-sm font-medium transition-all ${stateStyle}`}
                 >
                    <span className="opacity-50 mr-3 text-xs uppercase font-black">{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                 </button>
              );
           })}
        </div>

        {isAnswerChecked && (
           <div className="animate-fade-in space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-sm text-blue-200">
                 <span className="font-bold uppercase text-[10px] tracking-widest block mb-1 text-blue-400">Explication</span>
                 {q.explanation}
              </div>
              <button onClick={nextQuestion} className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                 Suivant <ChevronRight size={18} />
              </button>
           </div>
        )}
     </div>
  );
};

const ProfileView = ({ user, onLogout, onReset }: { user: User, onLogout: () => void, onReset: () => void }) => {
  return (
    <div className="space-y-8 animate-fade-in pt-6">
       <div className="text-center space-y-3">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-4xl mx-auto border-4 border-slate-900 shadow-xl">
             {user.avatar}
          </div>
          <div>
             <h2 className="text-2xl font-black text-white">{user.name}</h2>
             <p className="text-emerald-500 font-bold uppercase text-xs tracking-widest mt-1 bg-emerald-500/10 inline-block px-3 py-1 rounded-full">{user.role}</p>
          </div>
       </div>

       <div className="glass rounded-[2rem] overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex items-center gap-4">
             <div className="p-3 bg-slate-900 rounded-xl text-slate-400">
                <UserIcon size={20} />
             </div>
             <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Identifiant Unique</p>
                <p className="text-white font-mono text-sm">{user.uid}</p>
             </div>
          </div>
          <div className="p-6 flex items-center gap-4">
             <div className="p-3 bg-slate-900 rounded-xl text-slate-400">
                <ShieldAlert size={20} />
             </div>
             <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Code PIN Sécurité</p>
                <p className="text-white font-mono text-sm">••••</p>
             </div>
          </div>
       </div>

       <div className="space-y-3">
          <button onClick={onLogout} className="w-full p-5 glass rounded-2xl flex items-center justify-between group hover:bg-red-500/10 hover:border-red-500/20 transition-all border border-white/5">
             <span className="font-bold text-slate-300 group-hover:text-red-400 transition-colors">Déconnexion</span>
             <LogOut className="text-slate-500 group-hover:text-red-400 transition-colors" size={20} />
          </button>
          
          <button onClick={onReset} className="w-full p-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-red-500 transition-colors">
             <RefreshCw size={12} /> Réinitialiser l'application
          </button>
       </div>
    </div>
  );
};

export default App;