
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Message, Fortune, MemoryPair } from "../types";

// --- GESTION CLÉ API ---
const getApiKey = (): string => {
  let key = '';
  
  // Vérification des variables d'environnement Vite (import.meta.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Priorité à la clé définie par l'utilisateur
    // @ts-ignore
    if (import.meta.env.VITE_GEMINI_API_KEY) key = import.meta.env.VITE_GEMINI_API_KEY;
    // @ts-ignore
    else if (import.meta.env.VITE_API_KEY) key = import.meta.env.VITE_API_KEY;
  }

  // Fallback pour Node.js / process.env (si nécessaire)
  // @ts-ignore
  if (!key && typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    if (process.env.VITE_GEMINI_API_KEY) key = process.env.VITE_GEMINI_API_KEY;
    // @ts-ignore
    else if (process.env.API_KEY) key = process.env.API_KEY;
  }
  
  return key;
};

const apiKey = getApiKey();
// Initialisation de l'instance AI
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });

const BASE_INSTRUCTION = `
Tu es "Lǎoshī Bot", l'assistant pédagogique officiel du Groupe 5 - Licence 1 Chinois.
Ton : Formel, encourageant, expert en mandarin.
Tâches : Aide devoirs, grammaire, vocabulaire, culture chinoise.
Langue de réponse : Français (sauf pour les exemples en chinois).
`;

export const geminiService = {
  async *streamChatResponse(prompt: string, history: Message[] = [], userMemory: string = "", userName: string = "") {
    if (!apiKey || apiKey === "dummy_key") {
      yield "⚠️ Erreur Configuration : Clé API introuvable.\n\n1. Vérifiez que `VITE_GEMINI_API_KEY` est bien dans votre fichier `.env`.\n2. REDÉMARREZ votre serveur de développement (npm run dev) pour que les changements soient pris en compte.";
      return;
    }

    try {
      const historyFormatted = history.map(msg => ({
        role: msg.isAi ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Logique spécifique pour le créateur
      let dynamicInstruction = `${BASE_INSTRUCTION}\nContexte étudiant: ${userMemory}`;
      if (userName && userName.toLowerCase() === 'juliano') {
        dynamicInstruction += `\n\nIMPORTANT : L'utilisateur actuel est "Juliano". Tu dois t'adresser à lui en utilisant exclusivement le titre "cher créateur" (ou "mon cher créateur") au lieu de son pseudo. Sois particulièrement dévoué.`;
      }

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: dynamicInstruction,
          temperature: 0.6,
        },
        history: historyFormatted
      });

      const result = await chat.sendMessageStream({ message: prompt });
      for await (const chunk of result) {
        yield chunk.text || "";
      }
    } catch (error: any) {
      console.error("Gemini Error:", error);
      if (error.message?.includes("API key")) yield "Erreur API : La clé fournie est invalide. Vérifiez `VITE_GEMINI_API_KEY`.";
      else if (error.message?.includes("429")) yield "Service saturé (Quota dépassé), réessayez dans quelques instants.";
      else yield `Erreur technique : ${error.message || "Impossible de joindre Gemini."}`;
    }
  },

  // --- AUTRES FONCTIONS (Simplifiées pour éviter les crashs) ---

  async updateStudentProfile(oldMem: string, userMsg: string, aiMsg: string): Promise<string> {
    if (!apiKey || apiKey === "dummy_key") return oldMem;
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyse cet échange pour mettre à jour le profil étudiant (bref):\n${oldMem}\nÉtudiant: ${userMsg}\nIA: ${aiMsg}`,
      });
      return resp.text || oldMem;
    } catch (e) { return oldMem; }
  },

  async generateQuiz(topic: string, count: number = 3): Promise<QuizQuestion[]> {
    if (!apiKey || apiKey === "dummy_key") return [];
    try {
      // PROMPT MODIFIÉ : On force le contexte Chinois et la langue Française
      const resp = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Génère ${count} questions QCM portant EXCLUSIVEMENT sur la langue et la culture chinoise (Mandarin, Histoire, Coutumes).
        Sujet spécifique : ${topic}.
        Langue des questions et explications : FRANÇAIS.
        Format JSON strict.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });
      return JSON.parse(resp.text || "[]");
    } catch (e) { console.error(e); return []; }
  },

  async generateMemoryPairs(topic: string): Promise<MemoryPair[]> {
    if (!apiKey || apiKey === "dummy_key") return [];
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `6 paires de vocabulaire CHINOIS (Hanzi + Pinyin/Traduction Française) sur le thème : ${topic}. JSON strict.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                hanzi: { type: Type.STRING },
                pinyin: { type: Type.STRING },
                translation: { type: Type.STRING }
              },
              required: ["id", "hanzi", "pinyin", "translation"]
            }
          }
        }
      });
      return JSON.parse(resp.text || "[]");
    } catch (e) { return []; }
  },

  async generateAnnouncementImage(title: string, content: string): Promise<string | null> {
    if (!apiKey || apiKey === "dummy_key") return null;
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Generate a high quality, artistic illustration for an announcement about Chinese Studies titled "${title}". The content is: "${content}". IMPORTANT: Do not include any text inside the image.` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      if (resp.candidates?.[0]?.content?.parts) {
        for (const part of resp.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (e) { 
      return null; 
    }
  },

  async generateFortune(): Promise<Fortune | null> {
    if (!apiKey || apiKey === "dummy_key") return null;
    try {
      // PROMPT MODIFIÉ : On force les champs en Français
      const resp = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Génère un Fortune Cookie chinois authentique.
        - chengyu: Proverbe en caractères chinois.
        - pinyin: Transcription.
        - translation: Traduction en FRANÇAIS.
        - advice: Conseil philosophique en FRANÇAIS.
        - luckyColor: Une couleur porte-bonheur en FRANÇAIS.
        JSON strict.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                chengyu: { type: Type.STRING },
                pinyin: { type: Type.STRING },
                translation: { type: Type.STRING },
                advice: { type: Type.STRING },
                luckyColor: { type: Type.STRING }
              },
              required: ["chengyu", "pinyin", "translation", "advice", "luckyColor"]
            }
        }
      });
      return JSON.parse(resp.text || "{}");
    } catch (e) { return null; }
  }
};
