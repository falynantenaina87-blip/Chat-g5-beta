
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Message, Fortune, MemoryPair } from "../types";

// --- GESTION CLÉ API ---
const getApiKey = (): string => {
  let key = '';
  
  // Vérification des variables d'environnement Vite (import.meta.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env.VITE_API_KEY) key = import.meta.env.VITE_API_KEY;
    // @ts-ignore
    else if (import.meta.env.VITE_GEMINI_API_KEY) key = import.meta.env.VITE_GEMINI_API_KEY;
  }

  // Fallback pour Node.js / process.env
  // @ts-ignore
  if (!key && typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    if (process.env.API_KEY) key = process.env.API_KEY;
    // @ts-ignore
    else if (process.env.VITE_GEMINI_API_KEY) key = process.env.VITE_GEMINI_API_KEY;
  }
  
  return key;
};

const apiKey = getApiKey();
// Initialisation de l'instance AI
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });

const BASE_INSTRUCTION = `
Tu es "G5-Tuteur", l'assistant pédagogique officiel du Groupe 5 - Licence 1 Chinois.
Ton : Formel, encourageant, expert.
Tâches : Aide devoirs, grammaire, vocabulaire.
`;

export const geminiService = {
  async *streamChatResponse(prompt: string, history: Message[] = [], userMemory: string = "", userName: string = "") {
    if (!apiKey || apiKey === "dummy_key") {
      yield "⚠️ Erreur : Clé API manquante. Ajoutez VITE_GEMINI_API_KEY ou VITE_API_KEY dans votre fichier .env.";
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
      if (error.message?.includes("API key")) yield "Erreur: Clé API invalide ou mal configurée.";
      else if (error.message?.includes("429")) yield "Service saturé, réessayez dans 30s.";
      else yield "Erreur de communication avec le serveur (Vérifiez votre connexion ou la clé API).";
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
      const resp = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Génère ${count} questions QCM sur : ${topic}. Format JSON strict.`,
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
        contents: `6 paires vocabulaire (Hanzi + Pinyin/Trad) sur : ${topic}. JSON strict.`,
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
        contents: { parts: [{ text: `Illustration for: ${title}. ${content}` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      // @ts-ignore
      const data = resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return data ? `data:image/png;base64,${data}` : null;
    } catch (e) { return null; }
  },

  async generateFortune(): Promise<Fortune | null> {
    if (!apiKey || apiKey === "dummy_key") return null;
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Fortune cookie chinois. JSON strict.",
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
